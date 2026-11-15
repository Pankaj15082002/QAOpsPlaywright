const { expect } = require('@playwright/test');

class EcommercePage {
  constructor(page) {
    this.page = page;
  }

  async openLogin() {
    await this.page.goto('https://www.automationexercise.com/login');
  }

  async login(email, password) {
    const loginForm = this.page.locator('form').filter({ hasText: 'Login' });
    await loginForm.getByPlaceholder('Email Address').fill(email);
    await loginForm.getByPlaceholder('Password').fill(password);
    await loginForm.getByRole('button', { name: 'Login', exact: true }).click();
  }

  async expectLoginResult(result) {
    if (result === 'success') {
      await expect(this.page.getByRole('link', { name: /Logout/ })).toBeVisible();
      return;
    }

    if (result === 'Failure') {
      await expect(this.page.getByText('Your email or password is incorrect!')).toBeVisible();
      return;
    }

    throw new Error(`Unsupported login result "${result}".`);
  }

  async openProduct(productName) {
    const product = this.page.locator('.product-image-wrapper').filter({ hasText: productName }).first();
    await product.getByRole('link', { name: /View Product/ }).click();
  }

  async expectProductDetails(productName) {
    await expect(this.page.getByRole('heading', { name: productName, exact: true })).toBeVisible();
  }

  async addProductToCart() {
    await this.page.getByRole('button', { name: /Add to cart/ }).click();
    await expect(this.page.getByText('Your product has been added')).toBeVisible();
    await this.page.getByRole('link', { name: 'View Cart' }).click();
  }

  async expectCartProduct(productName) {
    await expect(this.page.locator('#cart_info_table').getByText(productName, { exact: true })).toBeVisible();
  }

  async proceedToCheckout() {
    await this.page.getByText('Proceed To Checkout', { exact: true }).click();
  }

  async expectAddressDetails() {
    await expect(this.page.getByRole('heading', { name: 'Address Details' })).toBeVisible();
  }

  async placeOrder({ cardName, cardNumber, cvc, expiryMonth, expiryYear }) {
    await this.page.getByRole('link', { name: 'Place Order', exact: true }).click();
    await this.page.locator('[name="name_on_card"]').fill(cardName);
    await this.page.locator('[name="card_number"]').fill(cardNumber);
    await this.page.locator('[name="cvc"]').fill(cvc);
    await this.page.locator('[name="expiry_month"]').fill(expiryMonth);
    await this.page.locator('[name="expiry_year"]').fill(expiryYear);
    await this.page.getByRole('button', { name: 'Pay and Confirm Order' }).click();
  }

  async expectOrderConfirmation() {
    await expect(this.page.getByText('Congratulations! Your order has been successfully placed!')).toBeVisible();
  }

  async continueShopping() {
    await this.page.getByRole('link', { name: 'Continue' }).click();
  }
}

module.exports = { EcommercePage };