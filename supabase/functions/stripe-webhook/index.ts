import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from "https://esm.sh/stripe@14.0.0"

console.log("Webhook V3: Com Data de Vencimento")

serve(async (req: Request) => {
  const signature = req.headers.get('Stripe-Signature')
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!signature || !stripeKey || !webhookSecret) return new Response('Config Error', { status: 400 })

  const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16', httpClient: Stripe.createFetchHttpClient() })
  const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

  try {
    const body = await req.text()
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)

    // 1. ATIVAÇÃO INICIAL (Checkout realizado)
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const userId = session.client_reference_id;
      const customerId = session.customer;

      if (userId) {
        // Recupera a assinatura para pegar a data de vencimento correta
        const subscriptionId = session.subscription;
        let expiresAt = null;
        
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          expiresAt = new Date(subscription.current_period_end * 1000).toISOString();
        }

        await supabase.from('profiles').update({ 
          plano: 'pro',
          stripe_customer_id: customerId,
          subscription_expires_at: expiresAt
        }).eq('id', userId);
        
        console.log(`✅ Plano PRO ativado para ${userId}. Vence em: ${expiresAt}`);
      }
    }

    // 2. RENOVAÇÃO OU ATUALIZAÇÃO (Stripe avisa que renovou o ciclo)
    else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
      const subscription = event.data.object as any;
      const customerId = subscription.customer;
      const expiresAt = new Date(subscription.current_period_end * 1000).toISOString();
      const status = subscription.status;

      // Só atualiza se o status for ativo ou trial
      if (status === 'active' || status === 'trialing') {
        await supabase
          .from('profiles')
          .update({ 
            plano: 'pro',
            subscription_expires_at: expiresAt 
          })
          .eq('stripe_customer_id', customerId);
          
        console.log(`🔄 Assinatura renovada para cliente ${customerId}. Nova validade: ${expiresAt}`);
      }
    }

    // 3. CANCELAMENTO
    else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any;
      const customerId = subscription.customer;

      await supabase
        .from('profiles')
        .update({ 
          plano: 'free',
          subscription_expires_at: null 
        })
        .eq('stripe_customer_id', customerId);

      console.log(`🛑 Plano cancelado para cliente ${customerId}`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err: any) {
    console.error(`Erro: ${err.message}`)
    return new Response(err.message, { status: 400 })
  }
})