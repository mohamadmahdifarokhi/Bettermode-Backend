Feature: User Management

  Scenario: Create a new user
    Given I have an authenticated admin
    When I create a user with name "Warren Buffett", email "warren@berkshire.com", and username "warrenbuffett"
    Then the user "Warren Buffett" should be created successfully
