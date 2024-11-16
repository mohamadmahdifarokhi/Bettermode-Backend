Feature: Messaging Management

  Scenario: Send a message from one user to another
    Given I have a user named "Alice"
    And I have a user named "Bob"
    And I authenticate user "Alice"
    When user "Alice" sends a message "Hi Bob!" to user "Bob"

  Scenario: Retrieve messages for a user
    Given I have a user named "Alice"
    And I have a user named "Bob"
    And I authenticate user "Alice"
    And user "Alice" has sent messages to user "Bob"
    When user "Bob" retrieves their messages
    Then user "Bob" should see all messages sent by user "Alice"
