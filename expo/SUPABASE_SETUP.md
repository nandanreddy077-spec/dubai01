# Glow App - Authentication Setup

## Supabase Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new account or sign in
2. Click "New Project"
3. Choose your organization and enter project details:
   - Name: `glow-app` (or any name you prefer)
   - Database Password: Create a strong password
   - Region: Choose the closest region to your users
4. Click "Create new project"
5. Wait for the project to be set up (this may take a few minutes)

### 2. Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **Anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 3. Update Environment Variables

1. Open the `.env` file in your project root
2. Replace the placeholder values with your actual Supabase credentials:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

### 4. Set Up Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `supabase-setup.sql` file
4. Paste it into the SQL editor
5. Click "Run" to execute all the queries

This will create:
- `profiles` table for user profile information
- `glow_analyses` table for beauty analysis results
- `style_analyses` table for outfit analysis results
- `skincare_plans` table for personalized skincare plans
- `user_stats` table for gamification data
- Row Level Security (RLS) policies to protect user data
- Triggers to automatically create profiles when users sign up

### 5. Configure Authentication (Optional)

By default, Supabase allows email/password authentication. If you want to customize:

1. Go to **Authentication** → **Settings**
2. Configure your preferred settings:
   - **Site URL**: Your app's URL (for email confirmations)
   - **Email confirmations**: Enable/disable email verification
   - **Social providers**: Add Google, Apple, etc. if needed

### 6. Test the Setup

1. Restart your development server
2. The app should now connect to Supabase
3. Try creating an account and signing in
4. Check your Supabase dashboard to see the new user and profile data

## Troubleshooting

### Common Issues:

1. **"Supabase is not configured" error**
   - Make sure your `.env` file has the correct values
   - Restart your development server after updating `.env`

2. **Authentication not working**
   - Verify your Project URL and Anon Key are correct
   - Check the Supabase dashboard for any error logs

3. **Database errors**
   - Make sure you ran all the SQL queries from `supabase-setup.sql`
   - Check the SQL Editor for any error messages

4. **RLS (Row Level Security) issues**
   - The setup includes proper RLS policies
   - Users can only access their own data
   - If you need to modify policies, do so in the Supabase dashboard

## Demo Mode

If you don't want to set up Supabase right now, the app will run in demo mode:
- Authentication screens will show placeholder messages
- You can still explore the app's features
- No data will be saved

## Next Steps

Once authentication is working:
1. Users can sign up and sign in
2. Profile data is automatically created
3. All analyses and plans are saved to the database
4. Users can only see their own data (thanks to RLS)
5. The gamification system tracks user progress

## Support

If you encounter any issues:
1. Check the console logs for error messages
2. Verify your Supabase project is active
3. Make sure all environment variables are set correctly
4. Ensure the database tables were created successfully