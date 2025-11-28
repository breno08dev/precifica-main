import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@12.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Configurações de CORS (Permite que seu Front-end chame essa função)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Inicializa a Stripe com a chave que está no cofre do Supabase
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
      apiVersion: '2022-11-15',
    })

    // 3. Recebe os dados do Front-end
    const { price_id, user_id, return_url } = await req.json()

    console.log(`Iniciando checkout para user: ${user_id} com price: ${price_id}`)

    // 4. Cria a Sessão de Pagamento na Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id, // O ID do plano (price_...)
          quantity: 1,
        },
      ],
      mode: 'subscription', // Assinatura recorrente
      success_url: `${return_url}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${return_url}`,
      client_reference_id: user_id, // Guardamos o ID do usuário para saber quem pagou depois
    })

    // 5. Devolve o link de pagamento para o Front-end redirecionar
    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Erro na função:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})