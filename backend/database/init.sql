-- SafeSteamTools Database Schema
-- This schema is designed for caching Steam API responses and rate limiting

-- Create database if it doesn't exist
CREATE DATABASE safesteam;

-- Connect to the database
\c safesteam;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_address INET NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for efficient rate limit lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_endpoint ON rate_limits(ip_address, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);

-- Steam profile cache
CREATE TABLE IF NOT EXISTS steam_profiles (
    steam_id VARCHAR(17) PRIMARY KEY,
    profile_data JSONB NOT NULL,
    privacy_state INTEGER NOT NULL DEFAULT 1,
    cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for cache expiration cleanup
CREATE INDEX IF NOT EXISTS idx_steam_profiles_expires ON steam_profiles(expires_at);
CREATE INDEX IF NOT EXISTS idx_steam_profiles_cached ON steam_profiles(cached_at);

-- Steam games cache
CREATE TABLE IF NOT EXISTS steam_games (
    steam_id VARCHAR(17) NOT NULL,
    games_data JSONB NOT NULL,
    game_count INTEGER NOT NULL DEFAULT 0,
    cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (steam_id)
);

CREATE INDEX IF NOT EXISTS idx_steam_games_expires ON steam_games(expires_at);

-- Steam inventory cache
CREATE TABLE IF NOT EXISTS steam_inventory (
    steam_id VARCHAR(17) NOT NULL,
    app_id INTEGER NOT NULL,
    inventory_data JSONB NOT NULL,
    item_count INTEGER NOT NULL DEFAULT 0,
    cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (steam_id, app_id)
);

CREATE INDEX IF NOT EXISTS idx_steam_inventory_expires ON steam_inventory(expires_at);

-- API usage statistics
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    ip_address INET,
    user_agent TEXT,
    steam_id VARCHAR(17),
    cached BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_usage_created ON api_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_status ON api_usage(status_code);

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Clean up expired profile cache
    DELETE FROM steam_profiles WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Clean up expired games cache
    DELETE FROM steam_games WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    -- Clean up expired inventory cache
    DELETE FROM steam_inventory WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    -- Clean up old rate limit entries (older than 24 hours)
    DELETE FROM rate_limits WHERE created_at < NOW() - INTERVAL '24 hours';
    
    -- Clean up old API usage logs (keep last 30 days)
    DELETE FROM api_usage WHERE created_at < NOW() - INTERVAL '30 days';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_steam_profiles_updated_at BEFORE UPDATE ON steam_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_steam_games_updated_at BEFORE UPDATE ON steam_games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_steam_inventory_updated_at BEFORE UPDATE ON steam_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limits_updated_at BEFORE UPDATE ON rate_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a user with limited privileges for the application
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'safesteam_app') THEN
        CREATE USER safesteam_app WITH PASSWORD 'secure_app_password';
    END IF;
END
$$;

-- Grant only necessary permissions
GRANT CONNECT ON DATABASE safesteam TO safesteam_app;
GRANT USAGE ON SCHEMA public TO safesteam_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO safesteam_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO safesteam_app;
GRANT EXECUTE ON FUNCTION cleanup_expired_cache() TO safesteam_app;

-- Comments for documentation
COMMENT ON TABLE steam_profiles IS 'Caches Steam profile data to reduce API calls';
COMMENT ON TABLE steam_games IS 'Caches owned games data for Steam profiles';
COMMENT ON TABLE steam_inventory IS 'Caches Steam inventory data for specific apps';
COMMENT ON TABLE rate_limits IS 'Tracks API rate limits per IP and endpoint';
COMMENT ON TABLE api_usage IS 'Logs API usage for analytics and monitoring';
COMMENT ON FUNCTION cleanup_expired_cache() IS 'Removes expired cache entries and old logs';

-- Initial data or settings can be added here if needed

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'SafeSteamTools database schema created successfully';
END
$$;