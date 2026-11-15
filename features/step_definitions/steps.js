const { Given, When, Then } = require('@cucumber/cucumber');

Given('the user opens the login page', async function () {
  await this.ecommercePage.openLogin();
});

When('the user logs in with email {string} and password {string}', async function (email, password) {
  await this.ecommercePage.login(email, password);
});

Then('the login result should be {string}', async function (result) {
  await this.ecommercePage.expectLoginResult(result);
});

When('the user opens the {string} product', async function (productName) {
  await this.ecommercePage.openProduct(productName);
});

Then('the product details for {string} should be displayed', async function (productName) {
  await this.ecommercePage.expectProductDetails(productName);
});

When('the user adds the product to the cart', async function () {
  await this.ecommercePage.addProductToCart();
});

Then('the {string} product should be displayed in the cart', async function (productName) {
  await this.ecommercePage.expectCartProduct(productName);
});

When('the user proceeds to checkout', async function () {
  await this.ecommercePage.proceedToCheckout();
});

Then('the billing address details should be displayed', async function () {
  await this.ecommercePage.expectAddressDetails();
});

When('the user places the order with valid payment details', async function () {
  await this.ecommercePage.placeOrder({
    cardName: process.env.CARD_NAME || 'Test User',
    cardNumber: process.env.CARD_NUMBER || '4111111111111111',
    cvc: process.env.CARD_CVC || '234',
    expiryMonth: process.env.CARD_EXPIRY_MONTH || '04',
    expiryYear: process.env.CARD_EXPIRY_YEAR || '2056',
  });
});

Then('the order confirmation should be displayed', async function () {
  await this.ecommercePage.expectOrderConfirmation();
});