import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const adminEmail = 'lucas@gruponexusmind.com.br'
    const adminPassword = 'Depaula29'
    const adminName = 'Lucas Admin'

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    })

    const userExists = existingUser?.users?.find(u => u.email === adminEmail)

    let userId = userExists?.id

    if (!userExists) {
      // Create the admin user only if it doesn't exist
      const { data: user, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          nome: adminName
        }
      })

      if (userError) {
        // Check if error is because user already exists
        if (userError.message.includes('already registered') || userError.message.includes('already exists')) {
          console.log('User already exists, proceeding to setup profile...')
          // Try to get the existing user
          const { data: existUsers } = await supabaseAdmin.auth.admin.listUsers()
          const foundUser = existUsers?.users?.find(u => u.email === adminEmail)
          userId = foundUser?.id
        } else {
          console.error('Error creating user:', userError)
          return new Response(
            JSON.stringify({ error: userError.message }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          )
        }
      } else {
        userId = user.user.id
      }
    }

    // Setup the admin profile using the existing function
    const { error: setupError } = await supabaseAdmin.rpc('setup_admin_user', {
      user_email: adminEmail,
      user_name: adminName
    })

    if (setupError) {
      console.error('Error setting up admin profile:', setupError)
      return new Response(
        JSON.stringify({ error: setupError.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Admin user created successfully',
        user_id: userId,
        existed: !!userExists 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})