-- 1. PLANS TABLE
CREATE TABLE IF NOT EXISTS public.plans (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    monthly_price NUMERIC DEFAULT 0,
    yearly_price NUMERIC DEFAULT 0,
    features JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SHOPS PROFILE (Centralized Sync)
CREATE TABLE IF NOT EXISTS public.shops_profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    shop_id TEXT UNIQUE NOT NULL, -- e.g. ORDERDO-LKO-123456
    shop_name TEXT NOT NULL,
    owner_name TEXT,
    phone TEXT,
    address TEXT,
    upi_id TEXT,
    shop_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES public.shops_profile(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES public.plans(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'pending')),
    start_date TIMESTAMPTZ DEFAULT NOW(),
    expiry_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PAYMENTS TABLE (Pending UTR verification)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES public.shops_profile(id),
    plan_id INTEGER REFERENCES public.plans(id),
    amount NUMERIC NOT NULL,
    utr TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ADMIN SETTINGS
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL
);

-- INSERT INITIAL ADMIN SETTINGS
INSERT INTO public.admin_settings (key, value) 
VALUES ('global_free_toggle', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- INSERT DEFAULT FREE PLAN
INSERT INTO public.plans (name, description, monthly_price, yearly_price, features)
VALUES ('Free', 'Basic plan for small shops', 0, 0, '{"qr_limit": 1, "kds": false, "reports": false, "upi": true}')
ON CONFLICT DO NOTHING;

-- ENABLE RLS (Security)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- POLICIES (Simplified for Admin usage)
CREATE POLICY "Public plans are viewable by everyone" ON public.plans FOR SELECT USING (true);
CREATE POLICY "Shops can view/edit their own profile" ON public.shops_profile FOR ALL USING (auth.uid() = id);
CREATE POLICY "Shops can view their own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = shop_id);
CREATE POLICY "Shops can view their own payments" ON public.payments FOR SELECT USING (auth.uid() = shop_id);
