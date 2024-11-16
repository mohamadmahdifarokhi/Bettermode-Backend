Feature: Permission Management

  Scenario: Grant and Revoke edit permission for a tweet
    Given I have a user named "Alice"
    And I authenticate user "Alice"
    And I have a tweet with content "Hello World" by user "Alice"
    And I have a user named "Bob"
    And I authenticate user "Bob"
    When I grant edit permission to user "Bob" for the tweet "Hello World"
    Then user "Bob" should have edit permissions for the tweet "Hello World"
    When I revoke edit permission from user "Bob" for the tweet "Hello World"
    Then user "Bob" should not have edit permissions for the tweet "Hello World"

  Scenario: Revoke edit permission from a user for a tweet
    Given I have a user named "Alice"
    And I authenticate user "Alice"
    And I have a tweet with content "Hello World" by user "Alice"
    And I have a user named "Bob"
    And I authenticate user "Bob"
    When I grant edit permission to user "Bob" for the tweet "Hello World"
    Then user "Bob" should have edit permissions for the tweet "Hello World"
    When I revoke edit permission from user "Bob" for the tweet "Hello World"
    Then user "Bob" should not have edit permissions for the tweet "Hello World"
