

// ========================================
// PORT
// ========================================
process.env.PORT = process.env.PORT || 3000


// ========================================
// ENVIRONMENT
// ========================================
process.env.NODE_ENV = process.env.NODE_ENV || 'dev'

// ========================================
// TOKEN EXPIRATION
// ========================================
// 60 * 60 * 24 * 30 => 30 days
process.env.TOKEN_EXPIRATION = '48H' //60 * 60 * 24 * 30   // también '48H'

// ========================================
// AUTHENTICATION SEED
// ========================================
process.env.SEED = process.env.SEED || 'my-secret'

// ========================================
// AUTHENTICATION CLOUDINARY
// ========================================
process.env.CLOUD_NAME = process.env.CLOUD_NAME || 'novemberrain'
process.env.CLOUD_API_KEY = process.env.CLOUD_API_KEY || '435832378726246'
process.env.CLOUD_API_SECRET = process.env.CLOUD_API_SECRET || 'HH-DOxij0jJBNKZJUlAUdSr8oms'

// ========================================
// GOOGLE CLIENT ID 
// ========================================
// process.env.CLIENT_ID_GOOGLE = process.env.CLIENT_ID_GOOGLE || '526901051951-48okpd7k5cserbpmltt880i10rsnl5sd.apps.googleusercontent.com'
process.env.CLIENT_ID_GOOGLE_WEB = process.env.CLIENT_ID_GOOGLE_WEB || '71461667183-1srbs2eogsq9qb45kkht5nd4ickn0ndo.apps.googleusercontent.com'
process.env.CLIENT_ID_GOOGLE_ANDROID = process.env.CLIENT_ID_GOOGLE_ANDROID || '71461667183-43vlll91sjg85jcqvrd73he5fr13r9u6.apps.googleusercontent.com'
process.env.CLIENT_ID_GOOGLE_IOS = process.env.CLIENT_ID_GOOGLE_IOS || '71461667183-j0cssemi3js5fpjpjdkj9v4gka54jopb.apps.googleusercontent.com'

// ========================================
// DATA BASE
// ========================================
let urlDB

if ( process.env.NODE_ENV === 'dev' )
    urlDB = 'mongodb://localhost:27017/salsantiago-db'
else
    urlDB = process.env.MONGO_URI

process.env.URLDB = urlDB