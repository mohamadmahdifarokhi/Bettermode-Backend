Feature: Group Management

  Scenario: Create a new group
    Given I have an authenticated admin
    And I have a user named "John Doe"
    When I create a group with name "Developers" and description "A group for developers"
    Then the group "Developers" should be created successfully

  Scenario: Add a user to a group
    Given I have an authenticated admin
    And I have a user named "John Doe"
    When I create a group with name "Developers" and description "A group for developers"
    Then user "John Doe" should be a member of group "Developers"
