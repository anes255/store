import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      nav: { home: 'Home', features: 'Features', pricing: 'Pricing', login: 'Login', signup: 'Start Free Trial', dashboard: 'Dashboard' },
      hero: { title: 'Build Your Online Empire', subtitle: 'Create a stunning store in minutes. Sell across all 58 wilayas with powerful tools, AI features, and zero coding.', cta: 'Start Free — 14 Days Trial', cta2: 'See How It Works' },
      features: { title: 'Everything You Need to Sell Online', subtitle: 'Powerful tools built for Algerian e-commerce' },
      pricing: { title: 'Simple, Transparent Pricing', monthly: 'Monthly', yearly: 'Yearly', trial: '14-day free trial', perMonth: '/month', start: 'Start Free Trial' },
      auth: { login: 'Login', register: 'Create Account', email: 'Email', password: 'Password', name: 'Full Name', phone: 'Phone Number', address: 'Address', city: 'City', wilaya: 'Wilaya', forgotPassword: 'Forgot password?', noAccount: "Don't have an account?", hasAccount: 'Already have an account?', storeOwnerLogin: 'Store Owner Login', platformAdmin: 'Platform Admin' },
      dashboard: { welcome: 'Welcome back', storeVisits: 'Store Visits', totalSales: 'Total Sales', totalOrders: 'Total Orders', avgOrderValue: 'Avg Order Value', products: 'Products', recentOrders: 'Recent Orders', salesOverview: 'Sales Overview', orderStatus: 'Order Status', viewDetails: 'View Details', addProduct: 'Add Product', viewOrders: 'View Orders', customers: 'Customers', settings: 'Settings' },
      sidebar: { dashboard: 'Dashboard', orders: 'Orders', abandonedOrders: 'Abandoned Orders', preparing: 'Preparing', orderArchive: 'Order Archive', onlineStore: 'Online Store', products: 'Products', deliveryCompanies: 'Delivery Companies', shippingPartners: 'Shipping Partners', shippingWilayas: 'Shipping Wilayas', customers: 'Customers', analytics: 'Analytics', costs: 'Costs', billing: 'Billing & Plans', settings: 'Settings', apps: 'Apps & Integrations', pages: 'Pages', coupons: 'Coupons', staff: 'Staff', domains: 'Domains' },
      orders: { title: 'Orders', all: 'All', pending: 'Pending', confirmed: 'Confirmed', preparing: 'Preparing', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled', returned: 'Returned', orderNumber: 'Order #', customer: 'Customer', total: 'Total', status: 'Status', date: 'Date', actions: 'Actions', noOrders: 'No orders yet', paymentMethod: 'Payment Method' },
      products: { title: 'Products', addProduct: 'Add Product', name: 'Product Name', price: 'Price', stock: 'Stock', category: 'Category', active: 'Active', inactive: 'Inactive', noProducts: 'No products yet' },
      store: { search: 'Search products...', allCategories: 'All Categories', new: 'New', addToCart: 'Add to Cart', buyNow: 'Buy Now', cart: 'Cart', checkout: 'Checkout', continueShopping: 'Continue Shopping', orderNow: 'Order Now', paymentMethod: 'Payment Method', cod: 'Cash on Delivery', ccp: 'CCP Direct Transfer', baridimob: 'BaridiMob QR Payment', bankTransfer: 'Bank Transfer', shippingInfo: 'Shipping Information', orderSummary: 'Order Summary', subtotal: 'Subtotal', shipping: 'Shipping', discount: 'Discount', total: 'Total', placeOrder: 'Place Order', orderSuccess: 'Order Placed Successfully!', trackOrder: 'Track Your Order' },
      common: { save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', search: 'Search', loading: 'Loading...', noData: 'No data found', confirm: 'Confirm', back: 'Back', next: 'Next', submit: 'Submit', viewAll: 'View All', close: 'Close', yes: 'Yes', no: 'No' },
      apps: { title: 'Apps & Integrations', subtitle: 'Supercharge your store with powerful apps and integrations.', install: 'Install', installed: 'Installed', googleSheets: 'Google Sheets Integration', abandonedCart: 'Abandoned Cart', whatsappRecovery: 'WhatsApp Recovery', whatsappStatus: 'WhatsApp Order Status', aiSalesBot: 'AI WhatsApp Sales Bot', fakeDetection: 'AI Fake Order Detection', smartReviews: 'Smart Reviews System' },
      recovery: { title: 'Cart Recovery', subtitle: 'Manage and automate abandoned order conversion.', totalCarts: 'Total Carts', recovered: 'Recovered', recoveredRevenue: 'Recovered Revenue', lostRevenue: 'Lost Revenue', syncData: 'Sync Data', automationSettings: 'Automation Settings' },
      staff: { title: 'Staff Management', addStaff: 'Add Staff Member', admin: 'Admin', preparer: 'Preparer', confirmer: 'Confirmer', accountant: 'Accountant', viewer: 'Viewer' },
      chatbot: { greeting: 'How may I assist you?', placeholder: 'Enter command...', suggestedActions: 'Suggested Actions', shippingRates: 'Shipping rates', bestSellers: 'Best sellers', contactInfo: 'Contact info' },
    }
  },
  fr: {
    translation: {
      nav: { home: 'Accueil', features: 'Fonctionnalités', pricing: 'Tarifs', login: 'Connexion', signup: 'Essai Gratuit', dashboard: 'Tableau de bord' },
      hero: { title: 'Créez Votre Empire en Ligne', subtitle: "Créez une boutique en quelques minutes. Vendez dans les 58 wilayas avec des outils puissants, l'IA et sans code.", cta: 'Essai Gratuit — 14 Jours', cta2: 'Voir Comment Ça Marche' },
      auth: { login: 'Connexion', register: 'Créer un Compte', email: 'Email', password: 'Mot de passe', name: 'Nom Complet', phone: 'Téléphone', address: 'Adresse', city: 'Ville', wilaya: 'Wilaya', forgotPassword: 'Mot de passe oublié ?', noAccount: "Pas de compte ?", hasAccount: 'Déjà un compte ?' },
      dashboard: { welcome: 'Bon retour', storeVisits: 'Visites', totalSales: 'Ventes Totales', totalOrders: 'Commandes', avgOrderValue: 'Valeur Moyenne', products: 'Produits', recentOrders: 'Commandes Récentes', salesOverview: 'Aperçu Ventes', addProduct: 'Ajouter Produit', viewOrders: 'Voir Commandes', customers: 'Clients', settings: 'Paramètres' },
      sidebar: { dashboard: 'Tableau de bord', orders: 'Commandes', abandonedOrders: 'Paniers Abandonnés', preparing: 'En Préparation', onlineStore: 'Boutique en Ligne', products: 'Produits', deliveryCompanies: 'Livraison', shippingPartners: 'Partenaires', shippingWilayas: 'Wilayas', customers: 'Clients', analytics: 'Analytiques', settings: 'Paramètres', apps: 'Applications', pages: 'Pages', coupons: 'Coupons', staff: 'Personnel', domains: 'Domaines' },
      common: { save: 'Enregistrer', cancel: 'Annuler', delete: 'Supprimer', edit: 'Modifier', search: 'Rechercher', loading: 'Chargement...', back: 'Retour', close: 'Fermer' },
      store: { search: 'Rechercher des produits...', allCategories: 'Toutes les Catégories', addToCart: 'Ajouter au Panier', checkout: 'Commander', total: 'Total', placeOrder: 'Passer la Commande' },
    }
  },
  ar: {
    translation: {
      nav: { home: 'الرئيسية', features: 'المميزات', pricing: 'الأسعار', login: 'تسجيل الدخول', signup: 'ابدأ مجاناً', dashboard: 'لوحة التحكم' },
      hero: { title: 'أنشئ إمبراطوريتك الرقمية', subtitle: 'أنشئ متجرك الإلكتروني في دقائق. بع في كل 58 ولاية بأدوات قوية وذكاء اصطناعي بدون برمجة.', cta: 'ابدأ مجاناً — 14 يوم', cta2: 'شاهد كيف يعمل' },
      auth: { login: 'تسجيل الدخول', register: 'إنشاء حساب', email: 'البريد الإلكتروني', password: 'كلمة المرور', name: 'الاسم الكامل', phone: 'رقم الهاتف', address: 'العنوان', city: 'المدينة', wilaya: 'الولاية' },
      dashboard: { welcome: 'مرحباً بعودتك', storeVisits: 'زيارات المتجر', totalSales: 'إجمالي المبيعات', totalOrders: 'إجمالي الطلبات', avgOrderValue: 'متوسط قيمة الطلب', products: 'المنتجات', recentOrders: 'الطلبات الأخيرة', addProduct: 'إضافة منتج', viewOrders: 'عرض الطلبات', customers: 'العملاء', settings: 'الإعدادات' },
      sidebar: { dashboard: 'لوحة التحكم', orders: 'الطلبات', abandonedOrders: 'السلات المتروكة', products: 'المنتجات', customers: 'العملاء', settings: 'الإعدادات', apps: 'التطبيقات', staff: 'الموظفين' },
      common: { save: 'حفظ', cancel: 'إلغاء', delete: 'حذف', edit: 'تعديل', search: 'بحث', loading: 'جاري التحميل...', back: 'رجوع', close: 'إغلاق' },
      store: { search: 'ابحث عن منتجات...', allCategories: 'كل الفئات', addToCart: 'أضف إلى السلة', checkout: 'إتمام الشراء', total: 'المجموع', placeOrder: 'تأكيد الطلب' },
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('lang') || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
