# Typical Topical

Alexa skill to use Expert.ai textual analysis and categorization in an interactive challenge

This repository contains the node.js code for a Lambda backend and a JSON interaction model that can be used to create Typical Topical, an interactive excercise challenging the user to match targets for topic, behavior type, and emotion type by speaking sentences which Expert.ai will analyze and score.

The skill may be implemented by using the ask-sdk cli, or with the Lambda and Alexa consoles. See:
https://developer.amazon.com/en-US/docs/alexa/alexa-skills-kit-sdk-for-nodejs/overview.html
https://developer.amazon.com/en-US/docs/alexa/smapi/ask-cli-intro.html

Note that the backend code makes use of two environment variables which will need to be provided to the Lambda function: Expert.ai username and password. The skill.json file will need to include an endpoint URI for the Lambda function.

## What it does

Typical Topical is a demonstration game that challenges you to say things that meet a target you are given for topic, behavior type and emotion type. You score based on how closely you meet those targets. The skill uses textual analysis from Expert.ai to detect and determine the topic, the behavior described and the emotion expressed in the statements you make.

LEVELS:
You can choose Easy, Medium, or Hard, to be given one, two, or three targets respectively. Say 'Easy', 'Medium' or Hard' to select a level.

SCORING
In each round, you will be dealt one or more of a topic, a behavior to describe, and an emotion to express.
• Topic
If Expert.ai detects the exact target topic in your statement you get 10 points.
• Behavior
If it detects that you incorporated the exact target behavior, you get 10 points. If you incorporate a behavior from the same general group and intensity of the target behavior, you get 4 points. If you incorporate a behavior from the same general group as the target behavior, you get 2 points.
• Emotion
If it detects that you expressed exact target emotion, you get 10 points. If it detects an emotion from the same emotion group, you get 4 points.
Scoring for any category is halved if you use the exact target word (topic, behavior or emotion).
Please do not be frustrated if the skill does not detect something that you think should be obvious. It happens. Just as in 'Whose Line is it Anyway'... the points don't matter.

NOTES:  
• If you say 'Repeat' after being dealt your targets, you can hear them again. Use this in case you are tongue-tied and need a bit more time to make up your statement.
• Sometimes if your statement is too long, Alexa will treat it as though you said nothing at all, and ask you to say something again. Either say something a little shorter, or say 'Repeat' to repeat the targets.
• If you say 'Repeat' after you are shown the results, you will get the same targets to try again, but you won't score. Use this to practice.
• If you say 'Help', you will hear more details, and receive a card in your Alexa app that has all this information.
• If you say 'Goodbye', you'll hear your final score before you leave.

The list of behavioral and emotion traits can be found at [https://docs.expert.ai/nlapi/v2/reference/categories/](https://docs.expert.ai/nlapi/v2/reference/categories/)
The list of detectable topics can be found at [https://docs.expert.ai/nlapi/v2/reference/topics/](https://docs.expert.ai/nlapi/v2/reference/topics/)

## How we built it

I used the Alexa Skills Kit SDK, creating interaction models in JSON and back-end processing as an AWS Lambda function using Node.js. I use the list of Expert.ai-detectable topics, and the hierarchies of behavioral traits and emotional traits to generate targets for the user to meet. After receiving a user utterance from Alexa, I send the utterance in parallel to three Expert.ai NL APIs: _analyze_ to detect a topic, _categorize/behavioral-traits_ to detect behavior, and _categorize/emotional-traits_ to detect emotions. Scoring is based on the ability of the user to utter a statement that meets the targets.
