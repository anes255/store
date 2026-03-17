import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      nav: { home: 'Home', features: 'Features', pricing: 'Pricing', login: 'Login', signup: 'Start Free Trial', dashboard: 'Dashboard' },
      hero: { title: 'Build Your Online Platform', subtitle: 'Create a stunning store in minutes. Sell across all 58 wilayas with powerful tools, AI features, and zero coding.', cta: 'Start Free — 14 Days Trial', cta2: 'See How It Works' },
      features: { title: 'Everything You Need to Sell Online', subtitle: 'Powerful tools built for Algerian e-commerce' },
      pricing: { title: 'Simple, Transparent Pricing', monthly: 'Monthly', yearly: 'Yearly', trial: '14-day free trial', perMonth: '/month', start: 'Start Free Trial' },
      auth: {
        login: 'Login', register: 'Create Account',
        loginSubtitle: 'Sign in to your store owner account',
        registerSubtitle: 'Create your store owner account',
        registerHeroTitle: 'Start your business today',
        registerHeroSubtitle: '14-day free trial. No credit card needed. Launch in minutes.',
        email: 'Email', password: 'Password', name: 'Full Name', phone: 'Phone Number',
        emailOrPhone: 'Email or Phone Number',
        emailOrPhonePlaceholder: 'you@email.com or phone number',
        emailOrPhoneRequired: 'Please provide at least an email or phone number',
        namePlaceholder: 'Your full name',
        phonePlaceholder: 'Your phone number',
        addressPlaceholder: 'Your address',
        address: 'Address', city: 'City', wilaya: 'Wilaya',
        forgotPassword: 'Forgot password?',
        noAccount: "Don't have an account?", hasAccount: 'Already have an account?',
        storeOwnerLogin: 'Store Owner Login', platformAdmin: 'Platform Admin'
      },
      dashboard: { welcome: 'Welcome back', storeVisits: 'Store Visits', totalSales: 'Total Sales', totalOrders: 'Total Orders', avgOrderValue: 'Avg Order Value', products: 'Products', recentOrders: 'Recent Orders', salesOverview: 'Sales Overview', orderStatus: 'Order Status', viewDetails: 'View Details', addProduct: 'Add Product', viewOrders: 'View Orders', customers: 'Customers', settings: 'Settings' },
      sidebar: { dashboard: 'Dashboard', orders: 'Orders', abandonedOrders: 'Abandoned Orders', preparing: 'Preparing', orderArchive: 'Order Archive', onlineStore: 'Online Store', products: 'Products', deliveryCompanies: 'Delivery Companies', shippingPartners: 'Shipping Partners', shippingWilayas: 'Shipping Wilayas', customers: 'Customers', analytics: 'Analytics', costs: 'Costs', billing: 'Billing & Plans', settings: 'Settings', apps: 'Apps & Integrations', pages: 'Pages', coupons: 'Coupons', staff: 'Staff', domains: 'Domains' },
      orders: { title: 'Orders', all: 'All', pending: 'Pending', confirmed: 'Confirmed', preparing: 'Preparing', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled', returned: 'Returned', orderNumber: 'Order #', customer: 'Customer', total: 'Total', status: 'Status', date: 'Date', actions: 'Actions', noOrders: 'No orders yet', paymentMethod: 'Payment Method' },
      products: { title: 'Products', addProduct: 'Add Product', name: 'Product Name', price: 'Price', stock: 'Stock', category: 'Category', active: 'Active', inactive: 'Inactive', noProducts: 'No products yet' },
      store: { search: 'Search products...', allCategories: 'All Categories', new: 'New', addToCart: 'Add to Cart', buyNow: 'Buy Now', cart: 'Cart', checkout: 'Checkout', continueShopping: 'Continue Shopping', orderNow: 'Order Now', paymentMethod: 'Payment Method', cod: 'Cash on Delivery', ccp: 'CCP Direct Transfer', baridimob: 'BaridiMob QR Payment', bankTransfer: 'Bank Transfer', shippingInfo: 'Shipping Information', orderSummary: 'Order Summary', subtotal: 'Subtotal', shipping: 'Shipping', discount: 'Discount', total: 'Total', placeOrder: 'Place Order', orderSuccess: 'Order Placed Successfully!', trackOrder: 'Track Your Order' },
      common: { save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', search: 'Search', loading: 'Loading...', noData: 'No data found', confirm: 'Confirm', back: 'Back', next: 'Next', submit: 'Submit', viewAll: 'View All', close: 'Close', yes: 'Yes', no: 'No' },
      apps: { title: 'Apps & Integrations', subtitle: 'Supercharge your store with powerful apps and integrations.' },
      recovery: { title: 'Cart Recovery', subtitle: 'Manage and automate abandoned order conversion.', totalCarts: 'Total Carts', recovered: 'Recovered', recoveredRevenue: 'Recovered Revenue', lostRevenue: 'Lost Revenue', syncData: 'Sync Data', automationSettings: 'Automation Settings' },
      staff: { title: 'Staff Management', addStaff: 'Add Staff Member' },
    }
  },
  fr: {
    translation: {
      nav: { home: 'Accueil', features: 'Fonctionnalités', pricing: 'Tarifs', login: 'Connexion', signup: 'Essai Gratuit', dashboard: 'Tableau de bord' },
      hero: { title: 'Créez Votre Plateforme en Ligne', subtitle: "Créez une boutique en quelques minutes. Vendez dans les 58 wilayas avec des outils puissants, l'IA et sans code.", cta: 'Essai Gratuit — 14 Jours', cta2: 'Voir Comment Ça Marche' },
      features: { title: 'Tout ce dont vous avez besoin pour vendre en ligne', subtitle: 'Des outils puissants pour le e-commerce algérien' },
      pricing: { title: 'Tarifs Simples et Transparents', start: 'Essai Gratuit' },
      auth: {
        login: 'Connexion', register: 'Créer un Compte',
        loginSubtitle: 'Connectez-vous à votre compte propriétaire',
        registerSubtitle: 'Créez votre compte propriétaire de boutique',
        registerHeroTitle: "Lancez votre business aujourd'hui",
        registerHeroSubtitle: "Essai gratuit de 14 jours. Sans carte bancaire.",
        email: 'Email', password: 'Mot de passe', name: 'Nom Complet', phone: 'Téléphone',
        emailOrPhone: 'Email ou Numéro de téléphone',
        emailOrPhonePlaceholder: 'email@exemple.com ou numéro de téléphone',
        emailOrPhoneRequired: 'Veuillez fournir au moins un email ou un numéro de téléphone',
        namePlaceholder: 'Votre nom complet',
        phonePlaceholder: 'Votre numéro de téléphone',
        addressPlaceholder: 'Votre adresse',
        address: 'Adresse', city: 'Ville', wilaya: 'Wilaya',
        forgotPassword: 'Mot de passe oublié ?',
        noAccount: "Pas de compte ?", hasAccount: 'Déjà un compte ?'
      },
      dashboard: { welcome: 'Bon retour', storeVisits: 'Visites', totalSales: 'Ventes Totales', totalOrders: 'Commandes', avgOrderValue: 'Valeur Moyenne', products: 'Produits', recentOrders: 'Commandes Récentes', salesOverview: 'Aperçu Ventes', addProduct: 'Ajouter Produit', viewOrders: 'Voir Commandes', customers: 'Clients', settings: 'Paramètres' },
      sidebar: { dashboard: 'Tableau de bord', orders: 'Commandes', abandonedOrders: 'Paniers Abandonnés', preparing: 'En Préparation', onlineStore: 'Boutique en Ligne', products: 'Produits', deliveryCompanies: 'Livraison', shippingPartners: 'Partenaires', shippingWilayas: 'Wilayas', customers: 'Clients', analytics: 'Analytiques', settings: 'Paramètres', apps: 'Applications', pages: 'Pages', coupons: 'Coupons', staff: 'Personnel', domains: 'Domaines' },
      common: { save: 'Enregistrer', cancel: 'Annuler', delete: 'Supprimer', edit: 'Modifier', search: 'Rechercher', loading: 'Chargement...', back: 'Retour', close: 'Fermer' },
      store: { search: 'Rechercher des produits...', allCategories: 'Toutes les Catégories', addToCart: 'Ajouter au Panier', checkout: 'Commander', total: 'Total', placeOrder: 'Passer la Commande' },
      orders: { title: 'Commandes', noOrders: 'Aucune commande', pending: 'En attente', confirmed: 'Confirmée', preparing: 'En préparation', shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée', returned: 'Retournée', orderNumber: 'N° Commande', customer: 'Client', total: 'Total', status: 'Statut', date: 'Date', actions: 'Actions', paymentMethod: 'Mode de paiement' },
      products: { title: 'Produits', addProduct: 'Ajouter Produit', noProducts: 'Aucun produit' },
      apps: { title: 'Applications & Intégrations', subtitle: 'Boostez votre boutique avec des applications puissantes.' },
      recovery: { title: 'Récupération de Paniers', subtitle: 'Gérez et automatisez la conversion des commandes abandonnées.', totalCarts: 'Total Paniers', recovered: 'Récupérés', recoveredRevenue: 'Revenus Récupérés', lostRevenue: 'Revenus Perdus', syncData: 'Synchroniser', automationSettings: 'Paramètres Automatisation' },
      staff: { title: 'Gestion du Personnel', addStaff: 'Ajouter un Membre' },
    }
  },
  ar: {
    translation: {
      nav: { home: 'الرئيسية', features: 'المميزات', pricing: 'الأسعار', login: 'تسجيل الدخول', signup: 'ابدأ مجاناً', dashboard: 'لوحة التحكم' },
      hero: { title: 'أنشئ منصتك الرقمية', subtitle: 'أنشئ متجرك الإلكتروني في دقائق. بع في كل 58 ولاية بأدوات قوية وذكاء اصطناعي بدون برمجة.', cta: 'ابدأ مجاناً — 14 يوم', cta2: 'شاهد كيف يعمل' },
      features: { title: 'كل ما تحتاجه للبيع عبر الإنترنت', subtitle: 'أدوات قوية مصممة للتجارة الإلكترونية الجزائرية' },
      pricing: { title: 'أسعار بسيطة وشفافة', start: 'ابدأ مجاناً' },
      auth: {
        login: 'تسجيل الدخول', register: 'إنشاء حساب',
        loginSubtitle: 'سجّل الدخول إلى حساب متجرك',
        registerSubtitle: 'أنشئ حساب صاحب متجر',
        registerHeroTitle: 'ابدأ عملك اليوم',
        registerHeroSubtitle: 'تجربة مجانية لمدة 14 يوماً. بدون بطاقة ائتمان.',
        email: 'البريد الإلكتروني', password: 'كلمة المرور', name: 'الاسم الكامل', phone: 'رقم الهاتف',
        emailOrPhone: 'البريد الإلكتروني أو رقم الهاتف',
        emailOrPhonePlaceholder: 'بريدك الإلكتروني أو رقم هاتفك',
        emailOrPhoneRequired: 'يرجى تقديم بريد إلكتروني أو رقم هاتف على الأقل',
        namePlaceholder: 'اسمك الكامل',
        phonePlaceholder: 'رقم هاتفك',
        addressPlaceholder: 'عنوانك',
        address: 'العنوان', city: 'المدينة', wilaya: 'الولاية',
        noAccount: 'ليس لديك حساب؟', hasAccount: 'لديك حساب بالفعل؟'
      },
      dashboard: { welcome: 'مرحباً بعودتك', storeVisits: 'زيارات المتجر', totalSales: 'إجمالي المبيعات', totalOrders: 'إجمالي الطلبات', avgOrderValue: 'متوسط قيمة الطلب', products: 'المنتجات', recentOrders: 'الطلبات الأخيرة', addProduct: 'إضافة منتج', viewOrders: 'عرض الطلبات', customers: 'العملاء', settings: 'الإعدادات' },
      sidebar: { dashboard: 'لوحة التحكم', orders: 'الطلبات', abandonedOrders: 'السلات المتروكة', products: 'المنتجات', customers: 'العملاء', settings: 'الإعدادات', apps: 'التطبيقات', staff: 'الموظفين', domains: 'النطاقات' },
      common: { save: 'حفظ', cancel: 'إلغاء', delete: 'حذف', edit: 'تعديل', search: 'بحث', loading: 'جاري التحميل...', back: 'رجوع', close: 'إغلاق' },
      store: { search: 'ابحث عن منتجات...', allCategories: 'كل الفئات', addToCart: 'أضف إلى السلة', checkout: 'إتمام الشراء', total: 'المجموع', placeOrder: 'تأكيد الطلب' },
      orders: { title: 'الطلبات', noOrders: 'لا توجد طلبات', pending: 'قيد الانتظار', confirmed: 'مؤكد', preparing: 'قيد التحضير', shipped: 'تم الشحن', delivered: 'تم التوصيل', cancelled: 'ملغى', returned: 'مرتجع' },
      products: { title: 'المنتجات', addProduct: 'إضافة منتج', noProducts: 'لا توجد منتجات' },
      apps: { title: 'التطبيقات والتكاملات', subtitle: 'عزز متجرك بتطبيقات وتكاملات قوية.' },
      recovery: { title: 'استرداد السلات', subtitle: 'إدارة وأتمتة تحويل الطلبات المتروكة.', totalCarts: 'إجمالي السلات', recovered: 'المستردة', recoveredRevenue: 'الإيرادات المستردة', lostRevenue: 'الإيرادات المفقودة', syncData: 'مزامنة', automationSettings: 'إعدادات الأتمتة' },
      staff: { title: 'إدارة الموظفين', addStaff: 'إضافة موظف' },
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
