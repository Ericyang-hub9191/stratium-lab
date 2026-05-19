const APP_NAME = "stratium_lab";
const APP_PHASE = "private_beta";
const SESSION_STARTED_AT_KEY = "stratiumlab_session_started_at";
const FIRST_SESSION_STATE_KEY = "stratiumlab_first_session_state";
const FIRST_SESSION_COMPLETED_KEY = "stratiumlab_first_session_proof_completed";

const isBrowser = typeof window !== "undefined";

function ensureSessionStartedAt() {
  if (!isBrowser) return Date.now();
  const existing = window.sessionStorage.getItem(SESSION_STARTED_AT_KEY);
  if (existing) return Number(existing);
  const now = Date.now();
  window.sessionStorage.setItem(SESSION_STARTED_AT_KEY, String(now));
  return now;
}

function getFirstSessionState() {
  if (!isBrowser) return {};
  try {
    return JSON.parse(window.sessionStorage.getItem(FIRST_SESSION_STATE_KEY) || "{}");
  } catch {
    return {};
  }
}

function setFirstSessionState(next) {
  if (!isBrowser) return;
  window.sessionStorage.setItem(FIRST_SESSION_STATE_KEY, JSON.stringify(next));
}

function hasCompletedFirstSessionProof() {
  if (!isBrowser) return true;
  return window.localStorage.getItem(FIRST_SESSION_COMPLETED_KEY) === "true";
}

function markFirstSessionProofCompleted() {
  if (!isBrowser) return;
  window.localStorage.setItem(FIRST_SESSION_COMPLETED_KEY, "true");
}

export function getSessionElapsedSeconds() {
  const startedAt = ensureSessionStartedAt();
  return Math.max(0, Math.round((Date.now() - startedAt) / 1000));
}

export function initAnalytics() {
  if (!isBrowser) return;
  ensureSessionStartedAt();

  const apiKey = import.meta.env.VITE_POSTHOG_KEY;
  const apiHost = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";
  if (!apiKey || window.posthog) return;

  window.posthog = window.posthog || [];
  window.posthog._i = window.posthog._i || [];
  window.posthog.init = function init(key, config) {
    const posthog = window.posthog;
    const methods = [
      "capture", "identify", "alias", "people.set", "people.set_once",
      "set_config", "register", "unregister", "reset",
    ];
    posthog._i.push([key, config]);
    methods.forEach(method => {
      const parts = method.split(".");
      const target = parts.length === 2 ? (posthog[parts[0]] = posthog[parts[0]] || []) : posthog;
      const name = parts[parts.length - 1];
      target[name] = target[name] || function queue() {
        target.push([name, ...Array.prototype.slice.call(arguments)]);
      };
    });
  };

  const script = document.createElement("script");
  script.async = true;
  script.src = `${apiHost}/static/array.js`;
  document.head.appendChild(script);

  window.posthog.init(apiKey, {
    api_host: apiHost,
    capture_pageview: false,
    loaded: (posthog) => posthog.register({ app: APP_NAME, app_phase: APP_PHASE }),
  });
}

export function identifyUser(user) {
  if (!isBrowser || !window.posthog?.identify || !user?.id) return;
  window.posthog.identify(user.id);
}

export function trackEvent(name, properties = {}) {
  if (!isBrowser) return;
  const payload = {
    app: APP_NAME,
    app_phase: APP_PHASE,
    path: window.location.pathname,
    ...properties,
  };
  if (window.posthog?.capture) {
    window.posthog.capture(name, payload);
  }
}

export function trackSignupStarted(source = "auth_redirect") {
  trackEvent("signup_started", {
    source,
    invite_id: null,
    entry_path: window.location.pathname,
  });
}

export function markFirstSessionStep(step, properties = {}) {
  if (!isBrowser || hasCompletedFirstSessionProof()) return;
  const previous = getFirstSessionState();
  const next = {
    ...previous,
    started_at: previous.started_at || ensureSessionStartedAt(),
    ...properties,
  };

  if (step === "boost_started") next.started_core_boost = true;
  if (step === "prompt_copied") next.copied_prompt = true;
  if (step === "prompt_used") next.prompt_used = true;
  if (step === "reflection_submitted") next.submitted_reflection = true;
  if (step === "practice_feedback_viewed") next.viewed_feedback = true;
  if (step === "outcome_answered") next.noticed_output_difference = properties.noticed_output_difference ?? "unknown";

  setFirstSessionState(next);
  maybeTrackFirstSessionProof(next);
}

function maybeTrackFirstSessionProof(state) {
  if (hasCompletedFirstSessionProof()) return;
  const promptWasUsed = state.copied_prompt || state.prompt_used;
  const hasOutcome = typeof state.noticed_output_difference === "string";
  if (!state.started_core_boost || !promptWasUsed || !state.submitted_reflection || !state.viewed_feedback || !hasOutcome) return;

  trackEvent("first_session_proof_completed", {
    boost_id: state.boost_id,
    time_to_proof_seconds: getSessionElapsedSeconds(),
    copied_prompt: Boolean(state.copied_prompt),
    submitted_reflection: true,
    viewed_feedback: true,
    noticed_output_difference: state.noticed_output_difference,
  });
  markFirstSessionProofCompleted();
}

export function getNavigationSource(defaultSource = "direct") {
  if (!isBrowser) return defaultSource;
  const params = new URLSearchParams(window.location.search);
  return params.get("source") || defaultSource;
}
