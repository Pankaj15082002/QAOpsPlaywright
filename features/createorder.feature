
Feature: Create an order on Automation Exercise

  Scenario: Login and successfully place an order
    Given the user opens the login page
    When the user logs in with email "pankaj987@gmail.com" and password "Pankaj@123"
    Then the login result should be "success"
    And the user opens the "Blue Top" product
    Then the product details for "Blue Top" should be displayed
    When the user adds the product to the cart
    Then the "Blue Top" product should be displayed in the cart
    When the user proceeds to checkout
    Then the billing address details should be displayed
    When the user places the order with valid payment details
    Then the order confirmation should be displayed

  Scenario: Reject invalid login credentials
    Given the user opens the login page
    When the user logs in with email "ram123@gmail.com" and password "ramesh@123"
    Then the login result should be "Failure"
