// stuff


module.exports = {
    // App name
    appName: 'heavinly host',

    // Public domain of Rocket Rides
    publicDomain: 'http://localhost:3000',

    // Server port
    port: 5000,

    // Secret for cookie sessions
    secret: 'GAVINS_COOL',

    // Configuration for Stripe
    // API Keys: https://dashboard.stripe.com/account/apikeys
    // Connect Settings: https://dashboard.stripe.com/account/applications/settings
    stripe: {
        secretKey: 'sk_test_51Ie28uB3Uhp7hlpD0uOuSfFwGI9nZ7C82YUL0qsuPms1C7IoQycPrTmY22kPecwzmsDqgnh3KtdaQWxP4GGSXvcE00XgnxtiKL',
        publishableKey: 'pk_test_51Ie28uB3Uhp7hlpDOPMnMzIEtmmeN6fXNZeL9ECk1iKUXBvoV9TNuSPqjvI10JhZtC8MaVZJd1e3qBAKR7lFkfrX00KhbtnGyB',
        clientId: 'ca_K9z90raHW3HssWLmNeD7fdK0rKrVlgQG',
        authorizeUri: 'https://connect.stripe.com/express/oauth/authorize',
        tokenUri: 'https://connect.stripe.com/oauth/token'
    },


};