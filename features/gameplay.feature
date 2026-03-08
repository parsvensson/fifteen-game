Feature: Core gameplay
  As a player
  I want the core puzzle loop to work reliably
  So I can play and track progress

  Scenario: Sliding updates move counter and timer
    Given I open the game
    When I slide tile "15"
    Then move count should be 1
    And timer should advance from 0:00

  Scenario: Solving triggers celebration and saves named highscore
    Given I open the game
    When I solve from the initial board with name "BDD Player"
    Then I should see solved status
    And I should see fireworks
    And I should see highscore "BDD Player" with 2 moves

  Scenario: Solving allows skipping name and stores default highscore name
    Given I open the game
    When I solve from the initial board and skip name
    Then I should see solved status
    And I should see highscore "Anonymous" with 2 moves

  Scenario: Shuffle resets counters
    Given I open the game
    When I slide tile "15"
    And I click shuffle
    Then move count should be 0
    And timer should be 0:00

  Scenario: Robot solves a simple unsolved board
    Given I open the game
    When I slide tile "15"
    And I click robot solve
    Then I should see solved status
