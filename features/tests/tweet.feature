Feature: Tweet Management

  Scenario: Create a new tweet and set permissions
    Given I have a user named "Alice"
    And I authenticate user "Alice"
    And I create a tweet with content "Hello World" by user "Alice"
    And I set view permissions for the tweet to include user "Alice"
    Then the tweet "Hello World" should be visible to user "Alice"
