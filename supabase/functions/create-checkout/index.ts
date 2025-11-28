import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@12.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // 1. Lidar com o Preflight Request (OPTIONS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Inicializar Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY não encontrada nas variáveis de ambiente')
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2022-11-15',
    })

    // 3. Ler o corpo da requisição
    const { price_id, user_id, return_url } = await req.json()

    if (!price_id || !user_id || !return_url) {
        throw new Error('Dados incompletos: price_id, user_id e return_url são obrigatórios')
    }

    console.log(`Iniciando checkout. User: ${user_id}, Price: ${price_id}`)

    // 4. Criar Sessão na Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${return_url}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${return_url}`,
      client_reference_id: user_id,
    })

    // 5. Retornar Sucesso
    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error: any) {
    console.error("Erro na função create-checkout:", error.message)
    
    // 6. Retornar Erro (IMPORTANTE: Incluir corsHeaders aqui também)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})