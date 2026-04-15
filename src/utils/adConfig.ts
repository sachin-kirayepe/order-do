export const AD_CONFIG = {
  enabled: true, // Master toggle
  showOnLanding: true,
  showOnOrderSuccess: true,
  showToPremiumUsers: false, // Whether to show ads to shopkeepers with active plans
  
  // Placeholder IDs - Replace these with actual Google AdSense Slot IDs
  slots: {
    landing_footer: '9876543210',
    order_success: '1234567890',
    dashboard_sidebar: '555666777'
  },
  
  // Options for custom sponsorship banners
  sponsorship: {
    enabled: true,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300&h=100',
    link: 'https://order-do.com/pro',
    text: 'Upgrade to Business Pro for Voice Analytics!'
  }
};
