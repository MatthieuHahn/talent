import withNextIntl from 'next-intl/plugin';

const withIntl = withNextIntl('./next-intl.config.ts');

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  }
};

export default withIntl(nextConfig);
