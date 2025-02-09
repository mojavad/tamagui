import { stripe } from '@lib/stripe'
import { Database } from '@lib/supabase-types'
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { NextApiHandler } from 'next'

const handler: NextApiHandler = async (req, res) => {
  const supabase = createServerSupabaseClient<Database>({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user

  if (!user) {
    res.status(401).json({
      error: 'The user is not authenticated',
    })
    return
  }
  const subId = req.body['subscription_id']
  if (typeof subId === 'undefined') {
    res.status(400).json({
      error: 'subscription_id is required',
    })
  }
  if (typeof subId !== 'string') {
    res.status(400).json({
      error: 'Invalid subscription_id',
    })
    return
  }
  const { error } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('id', subId)
    .single()
  if (error) {
    console.log(error)
    res
      .status(404)
      .json({ message: 'no subscription found with the provided id that belongs to you' })
  }

  const data = await stripe.subscriptions.update(subId, {
    cancel_at_period_end: false,
  })
  if (data) {
    res.json({ message: 'The subscription is active again.' })
  }
}

export default handler
