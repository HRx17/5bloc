/**
 * Lightweight analytics bootstrap.
 * Loads PostHog only when NEXT_PUBLIC_POSTHOG_KEY is set (script inject — no package required).
 */

let started = false

function injectPostHogSnippet(key: string, host: string): void {
  if (typeof document === 'undefined') return
  if (document.getElementById('posthog-snippet')) return

  const script = document.createElement('script')
  script.id = 'posthog-snippet'
  script.async = true
  script.text = `
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getRateLimits add_group remove_group startExceptionAutocapture stopExceptionAutocapture opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    posthog.init(${JSON.stringify(key)},{api_host:${JSON.stringify(host)},person_profiles:'identified_only',capture_pageview:true});
  `
  document.head.appendChild(script)
}

/** Initialize client analytics when env key is present. Safe to call multiple times. */
export async function initAnalytics(): Promise<void> {
  if (started || typeof window === 'undefined') return

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim()
  if (!key) return

  started = true
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || 'https://us.i.posthog.com'
  injectPostHogSnippet(key, host)
}
