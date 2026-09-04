/** Client-side Razorpay checkout helpers */

export async function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if ((window as any).Razorpay) return true
  return new Promise((resolve) => {
    const existing = document.querySelector('script[data-razorpay]')
    if (existing) {
      existing.addEventListener('load', () => resolve(!!(window as any).Razorpay))
      existing.addEventListener('error', () => resolve(false))
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.dataset.razorpay = '1'
    script.onload = () => resolve(!!(window as any).Razorpay)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

type StartCheckoutOpts = {
  plan: 'solo' | 'team' | 'badge' | 'ai'
  redirect?: string
}

export async function startRazorpayCheckout(opts: StartCheckoutOpts): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch('/api/payments/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan: opts.plan }),
  })
  const data = await res.json()
  if (!res.ok) return { ok: false, message: data.error || 'Could not create subscription' }

  if (data.mock) {
    return {
      ok: false,
      message:
        'Razorpay keys are not configured. Set RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET / NEXT_PUBLIC_RAZORPAY_KEY_ID to enable checkout.',
    }
  }

  const loaded = await loadRazorpayScript()
  if (!loaded || !(window as any).Razorpay) {
    return { ok: false, message: 'Razorpay checkout script failed to load' }
  }

  return new Promise((resolve) => {
    const rzp = new (window as any).Razorpay({
      key: data.key_id,
      subscription_id: data.subscription_id,
      name: '5Bloc',
      description: `5Bloc ${opts.plan} plan`,
      image: '/icons/icon-192.png',
      prefill: { email: data.email || '' },
      theme: { color: '#F5A623' },
      handler: () => {
        window.location.href = opts.redirect || '/settings?subscribed=true'
        resolve({ ok: true })
      },
      modal: {
        ondismiss: () =>
          resolve({ ok: false, message: 'Checkout cancelled — you have not been charged and your plan is unchanged.' }),
      },
    })
    rzp.open()
  })
}

/**
 * Collects payment for a client invoice. The invoice is only marked paid once the
 * Razorpay webhook confirms capture, so the caller should re-fetch afterwards.
 */
export async function startInvoiceCheckout(invoiceId: string): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch('/api/payments/invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ invoice_id: invoiceId }),
  })
  const data = await res.json()
  if (!res.ok) return { ok: false, message: data.error || 'Could not start the payment' }
  if (data.mock) return { ok: false, message: data.message }

  const loaded = await loadRazorpayScript()
  if (!loaded || !(window as any).Razorpay) {
    return { ok: false, message: 'Razorpay checkout script failed to load' }
  }

  return new Promise((resolve) => {
    const rzp = new (window as any).Razorpay({
      key: data.key_id,
      order_id: data.order_id,
      amount: data.amount,
      currency: data.currency,
      name: '5Bloc',
      description: `Invoice ${data.invoice_number || ''}`.trim(),
      image: '/icons/icon-192.png',
      prefill: { email: data.email || '' },
      theme: { color: '#F5A623' },
      handler: () =>
        resolve({
          ok: true,
          message: 'Payment received. The invoice is marked paid once Razorpay confirms it.',
        }),
      modal: {
        ondismiss: () =>
          resolve({ ok: false, message: 'Payment cancelled — you have not been charged and the invoice is unchanged.' }),
      },
    })
    rzp.open()
  })
}
