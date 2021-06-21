const Alexa = require("ask-sdk-core");
const axios = require("axios");

const emotions = require("./emotions");
const behaviors = require("./behaviors");
const topics = require("./topics");

const helpCard =
  "Typical Topical is a demonstration game that challenges you to say things that meet targets you are given for topic, behavior type and emotion type. You score based on how closely you meet those targets. The skill uses textual analysis from Expert.ai to detect and determine the topic, the behavior described and the emotion expressed in the statements you make.\n\nLEVELS:\nYou can choose Easy, Medium, or Hard, to be given one, two, or three targets respectively. Say 'Easy', 'Medium' or Hard' to select a level.\n\nSCORING:\nIn each round, you will be dealt a topic, a behavior to describe, and an emotion to express.\n• Topic\nIf Expert.ai detects the exact target topic in your statement you get 10 points.\n• Behavior\nIf it detects that you incorporated the exact target behavior, you get 10 points. If you incorporate a behavior from the same general group and intensity of the target behavior, you get 4 points. If you incorporate a behavior from the same general group as the target behavior, you get 2 points.\n• Emotion\nIf it detects that you expressed exact target emotion, you get 10 points. If it detects an emotion from the same emotion group, you get 4 points.\nScoring for any category is halved if you use the exact target word (topic, behavior or emotion).\nPlease do not be frustrated if the skill does not detect something that you think should be obvious. It happens. Just as in 'Whose Line is it Anyway'... the points don't matter.\n\nNOTES:\n• If you say 'Repeat' after being dealt your targets, you can hear them again. Use this in case you are tongue-tied and need a bit more time to make up your statement.\n• Sometimes if your statement is too long, Alexa will treat it as though you said nothing at all, and ask you to say something again. Either say something a little shorter, or say 'Repeat' to repeat the targets.\n• If you say 'Repeat' after you are shown the results, you will get the same targets to try again, but you won't score. Use this to practice.\n• If you say 'Help', you will hear more details, and receive a card in your Alexa app that has all this information.\n• If you say 'Goodbye', you'll hear your final score before you leave.\n\nFor more information on Expert.ai, visit https://Expert.ai\nThe list of behavioral and emotion traits can be found at https://docs.expert.ai/nlapi/v2/reference/categories/\nThe list of detectable topics can be found at https://docs.expert.ai/nlapi/v2/reference/topics/\n";

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "LaunchRequest"
    );
  },
  handle(handlerInput) {
    var attributes = handlerInput.attributesManager.getSessionAttributes();
    attributes.score = 0;
    attributes.started = false;
    attributes.level = "hard";
    var cards = [];
    const colors = ["red", "darkgreen", "goldenrod", "blue", "purple"];
    for (var i = 0; i < 5; i++) {
      cards.push([
        "Emotion",
        emotions[randomIntFromInterval(0, emotions.length - 1)][0],
        colors[randomIntFromInterval(0, colors.length - 1)],
        "E",
      ]);
      cards.push([
        "Behavior",
        behaviors[randomIntFromInterval(0, behaviors.length - 1)][0],
        colors[randomIntFromInterval(0, colors.length - 1)],
        "B",
      ]);
      cards.push([
        "Topic",
        capitalize(topics[randomIntFromInterval(0, topics.length - 1)]),
        colors[randomIntFromInterval(0, colors.length - 1)],
        "T",
      ]);
    }
    const say =
      "In Typical Topical you will be given a target topic, a behavioral trait, and an emotional trait, and asked to say something where I can detect your targets using Expert dot A.I.. You score based on how well I detect the targets in what you say. Say, easy, for one target, medium, for two targets, or hard, for three targets. Say help for more details, or say continue to begin with three targets.";
    if (supportsAPL(handlerInput)) {
      const myDoc = require("./launch.json");
      return handlerInput.responseBuilder
        .speak(say)
        .withSimpleCard("Typical Topical", helpCard)
        .addDirective({
          type: "Alexa.Presentation.APL.RenderDocument",
          token: "launchToken",
          document: myDoc,
          datasources: {
            launchData: {
              type: "object",
              properties: {
                targets: cards,
                hintTextToTransform: "continue",
              },
              transformers: [
                {
                  inputPath: "hintTextToTransform",
                  transformer: "textToHint",
                  outputName: "transformedHintText",
                },
              ],
            },
          },
        })
        .reprompt("Say, start game, to begin, or say help, for more details.")
        .getResponse();
    }

    return handlerInput.responseBuilder.speak(say).reprompt(say).getResponse();
  },
};

const startGameHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return (
      request.type === "IntentRequest" &&
      (request.intent.name === "StartGameIntent" ||
        request.intent.name === "continueIntent")
    );
  },

  async handle(handlerInput) {
    var attributes = handlerInput.attributesManager.getSessionAttributes();
    var say = "";

    if (!attributes.hasOwnProperty("level")) {
      attributes.level = "hard";
    }
    attributes.started = true;

    if (!attributes.hasOwnProperty("score")) attributes.score = 0;

    let emotion = emotions[randomIntFromInterval(0, emotions.length - 1)];

    let behavior = behaviors[randomIntFromInterval(0, behaviors.length - 1)];

    let topic = topics[randomIntFromInterval(0, topics.length - 1)];

    attributes.emotion = emotion;
    attributes.behavior = behavior;
    attributes.topic = topic;
    const categories3 = ["topic", "behavior", "emotion"];
    const categories2 = ["behavior", "emotion"];
    let category = "";

    if (attributes.level == "easy") {
      say += `Say something `;
      category = categories3[randomIntFromInterval(0, 2)];
      if (category == "topic")
        say += ` with topic <voice name="Matthew">${topic}</voice>.`;
      else if (category == "behavior")
        say += `describing behavior <voice name="Matthew">${behavior[0]}</voice>`;
      else
        say += `expressed with emotion <voice name="Matthew">${emotion[0]}</voice>`;
      attributes.categories = [category];
    } else if (attributes.level == "medium") {
      say = `Say something with topic <voice name="Matthew">${topic}</voice>, and `;
      category = categories2[randomIntFromInterval(0, 1)];
      if (category == "behavior")
        say += `describing behavior <voice name="Matthew">${behavior[0]}</voice>`;
      else
        say += `expressed with emotion <voice name="Matthew">${emotion[0]}</voice>`;
      attributes.categories = ["topic", category];
    } else {
      say += `Say something with topic <voice name="Matthew">${topic}</voice>, describing behavior <voice name="Matthew">${behavior[0]}</voice>, and expressed with emotion <voice name="Matthew">${emotion[0]}</voice>.`;
      attributes.categories = ["topic", "behavior", "emotion"];
    }

    handlerInput.attributesManager.setSessionAttributes(attributes);

    if (supportsAPL(handlerInput)) {
      const myDoc = require("./combinedCards.json");
      /* console.log(
        "TOPIC: ",
        attributes.categories.includes("topic") ? capitalize(topic) : ""
      );
      console.log(
        "BEHAVIOR: ",
        attributes.categories.includes("behavior") ? behavior[0] : ""
      );
      console.log(
        "EMOTION: ",
        attributes.categories.includes("emotion") ? emotion[0] : ""
      ); */
      return handlerInput.responseBuilder
        .speak(say)
        .addDirective({
          type: "Alexa.Presentation.APL.RenderDocument",
          token: "targetToken",
          document: myDoc,
          datasources: {
            targetData: {
              type: "object",
              properties: {
                targets: {
                  targetBehavior: attributes.categories.includes("behavior")
                    ? behavior[0]
                    : "",
                  targetEmotion: attributes.categories.includes("emotion")
                    ? emotion[0]
                    : "",
                  targetTopic: attributes.categories.includes("topic")
                    ? capitalize(topic)
                    : "",
                },
                score: attributes.score,
                hintTextToTransform: "continue",
              },
              transformers: [
                {
                  inputPath: "hintTextToTransform",
                  transformer: "textToHint",
                  outputName: "transformedHintText",
                },
              ],
            },
          },
        })
        .reprompt(
          "I didn't catch that. Say it again more concisely, or say, repeat, to hear the targets again. "
        )
        .getResponse();
    }

    return handlerInput.responseBuilder.speak(say).reprompt(say).getResponse();
  },
};

const repeatIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return (
      request.type === "IntentRequest" &&
      (request.intent.name === "RepeatIntent" ||
        request.intent.name === "doOverIntent")
    );
  },

  async handle(handlerInput) {
    var attributes = handlerInput.attributesManager.getSessionAttributes();
    var say = "";
    if (attributes.hasOwnProperty("categories")) {
      if (attributes.hasOwnProperty("started") && attributes.started == false) {
        attributes.doOver = true;
        attributes.started = true;
        say = "Repeating for no points. ";
      }
      if (attributes.level == "easy") {
        say += `Say something `;
        if (attributes.categories[0] == "topic")
          say += ` with topic <voice name="Matthew">${attributes.topic}</voice>.`;
        else if (attributes.categories[0] == "behavior")
          say += `describing behavior <voice name="Matthew">${attributes.behavior[0]}</voice>`;
        else
          say += `expressed with emotion <voice name="Matthew">${attributes.emotion[0]}</voice>`;
      } else if (attributes.level == "medium") {
        say = `Say something with topic <voice name="Matthew">${attributes.topic}</voice>, and `;
        if (attributes.categories[0] == "behavior")
          say += `describing behavior <voice name="Matthew">${attributes.behavior[0]}</voice>`;
        else
          say += `expressed with emotion <voice name="Matthew">${attributes.emotion[0]}</voice>`;
      } else {
        say += `Say something with topic <voice name="Matthew">${attributes.topic}</voice>, describing behavior <voice name="Matthew">${attributes.behavior[0]}</voice>, and expressed with emotion <voice name="Matthew">${attributes.emotion[0]}</voice>.`;
      }
    } else say = "Say, continue, to begin.";

    return handlerInput.responseBuilder.speak(say).reprompt(say).getResponse();
  },
};

const utteranceHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return (
      request.type === "IntentRequest" &&
      request.intent.name === "UtteranceIntent"
    );
  },
  async handle(handlerInput) {
    const query = handlerInput.requestEnvelope.request.intent.slots.text.value;
    var attributes = handlerInput.attributesManager.getSessionAttributes();

    if (attributes.started != true) {
      return handlerInput.responseBuilder
        .speak("Say, continue, for your next challenge.")
        .reprompt("Say, continue, for your next challenge.")
        .getResponse();
    }
    const hasTopic = attributes.categories.includes("topic");
    const hasBehavior = attributes.categories.includes("behavior");
    const hasEmotion = attributes.categories.includes("emotion");
    var say = "";
    var reSay = "Say, continue, to proceed. ";
    var ePenalty = 1,
      bPenalty = 1,
      tPenalty = 1;
    if (
      hasTopic &&
      query.toLowerCase().includes(attributes.topic.toLowerCase())
    ) {
      tPenalty = 2;
    }
    if (
      hasBehavior &&
      query.toLowerCase().includes(attributes.behavior[0].toLowerCase())
    ) {
      bPenalty = 2;
    }
    if (
      hasEmotion &&
      query.toLowerCase().includes(attributes.emotion[0].toLowerCase())
    ) {
      ePenalty = 2;
    }
    attributes.started = false;
    var analyze, categorize, behavioral;
    var topicColor, emotionColor, behaviorColor;
    var detectedTopic = "",
      detectedEmotion = "",
      detectedBehavior = "";
    var topicIcon = "",
      behaviorIcon = "",
      emotionIcon = "";
    try {
      [analyze, categorize, behavioral] = await Promise.allSettled([
        hasTopic ? getAnalyze(handlerInput, query) : getNull(),
        hasEmotion ? getCategorize(handlerInput, query) : getNull(),
        hasBehavior ? getBehavioral(handlerInput, query) : getNull(),
      ]);
    } catch (err) {
      console.log("Bad return from Expert.ai! ", err);
    }

    /*  console.log("Analyze: ", JSON.stringify(analyze));
    console.log("Categorize: ", JSON.stringify(categorize));
    console.log("Behavioral: ", JSON.stringify(behavioral)); */
    var guessed;

    if (hasTopic) {
      if (analyze.value.data.topics.length > 0) {
        guessed = false;
        for (var i = 0; i < analyze.value.data.topics.length; i++) {
          if (attributes.topic == analyze.value.data.topics[i].label)
            detectedTopic +=
              "<b>" +
              capitalize(analyze.value.data.topics[i].label) +
              "</b><br>";
          else
            detectedTopic +=
              capitalize(analyze.value.data.topics[i].label) + "<br>";
        }
        for (var i = 0; i < analyze.value.data.topics.length; i++) {
          if (attributes.topic == analyze.value.data.topics[i].label) {
            guessed = true;
            break;
          }
        }
        if (guessed) {
          {
            if (!attributes.doOver) {
              say += `${10 / tPenalty} points for topic match, ${
                attributes.topic
              }. `;
              attributes.score += 10 / tPenalty;
            } else say += "Topic match. ";
            topicColor = "darkgreen";
            topicIcon = "👍";
          }
        } else {
          topicColor = "red";
          topicIcon = "👎";
          say += ` For topic I detected ${analyze.value.data.topics[0].label}`;
          if (analyze.value.data.topics.length > 1) {
            for (var i = 1; i < analyze.value.data.topics.length - 1; i++) {
              say += `,  ${analyze.value.data.topics[i].label}`;
            }
            say += `, or ${
              analyze.value.data.topics[analyze.value.data.topics.length - 1]
                .label
            }. `;
          } else say += ". ";
          say += ` Instead of target, ${attributes.topic}. `;
        }
      } else {
        detectedTopic = "?";
        topicColor = "goldenrod";
        topicIcon = "🤔";
        say += `I wasn't able to determine your topic. `;
      }
    }

    if (hasBehavior) {
      if (behavioral.value.data.categories.length > 0) {
        for (var i = 0; i < behavioral.value.data.categories.length; i++) {
          if (
            attributes.behavior[0] == behavioral.value.data.categories[i].label
          )
            detectedBehavior +=
              "<b>" + behavioral.value.data.categories[i].label + "</b><br>";
          else
            detectedBehavior +=
              behavioral.value.data.categories[i].label + "<br>";
        }
        guessed = false;
        for (var i = 0; i < behavioral.value.data.categories.length; i++) {
          if (
            attributes.behavior[0] == behavioral.value.data.categories[i].label
          ) {
            guessed = true;
            break;
          }
        }
        if (guessed) {
          if (!attributes.doOver) {
            say += ` ${10 / bPenalty} points for behavior match, ${
              attributes.behavior[0]
            }. `;
            attributes.score += 10 / bPenalty;
          } else say += "Behavior match. ";
          behaviorColor = "darkgreen";
          behaviorIcon = "👍";
        } else if (
          attributes.behavior[2] ==
          behavioral.value.data.categories[0].hierarchy[1]
        ) {
          if (!attributes.doOver) {
            say += `${4 / bPenalty} points for a behavior subgroup match, ${
              attributes.behavior[2]
            }. `;
            attributes.score += 4 / bPenalty;
          } else say += "Behavior subgroup match. ";
          behaviorColor = "darkolivegreen";
          behaviorIcon = "👍";
        } else if (
          attributes.behavior[1] ==
          behavioral.value.data.categories[0].hierarchy[2]
        ) {
          if (!attributes.doOver) {
            say += `${2 / bPenalty} points for a behavior group match, ${
              attributes.behavior[1]
            }. `;
            attributes.score += 2 / bPenalty;
          } else say += "Behavior group match. ";
          behaviorColor = "darkkhaki";
          behaviorIcon = "👍";
        } else {
          behaviorColor = "red";
          behaviorIcon = "👎";
          say += ` For behavior I detected ${behavioral.value.data.categories[0].label}`;
          if (behavioral.value.data.categories.length > 1) {
            for (
              var i = 1;
              i < behavioral.value.data.categories.length - 1;
              i++
            ) {
              say += `,  ${behavioral.value.data.categories[i].label}`;
            }
            say += `, and ${
              behavioral.value.data.categories[
                behavioral.value.data.categories.length - 1
              ].label
            }. `;
          } else say += ". ";
          say += ` instead of target behavior, ${attributes.behavior[0]}. `;
        }
      } else {
        detectedBehavior = "?";
        behaviorColor = "goldenrod";
        behaviorIcon = "🤔";
        say += `I wasn't able to detect a behavior. `;
      }
    }
    if (hasEmotion) {
      if (categorize.value.data.categories.length > 0) {
        for (var i = 0; i < categorize.value.data.categories.length; i++) {
          if (
            attributes.emotion[0] == categorize.value.data.categories[i].label
          )
            detectedEmotion +=
              "<b>" + categorize.value.data.categories[i].label + "</b><br>";
          else
            detectedEmotion +=
              categorize.value.data.categories[i].label + "<br>";
        }
        guessed = false;
        for (var i = 0; i < categorize.value.data.categories.length; i++) {
          if (
            attributes.emotion[0] == categorize.value.data.categories[i].label
          ) {
            guessed = true;
            break;
          }
        }
        if (guessed) {
          if (!attributes.doOver) {
            say += `${10 / ePenalty} points for emotion match, ${
              attributes.emotion[0]
            }. `;
            attributes.score += 10 / ePenalty;
          } else say += "Emotion match. ";
          emotionColor = "darkgreen";
          emotionIcon = "👍";
        } else if (
          attributes.emotion[1] ==
          categorize.value.data.categories[0].hierarchy[0]
        ) {
          if (!attributes.doOver) {
            say += `${4 / ePenalty} points for an emotion group match, ${
              attributes.emotion[1]
            }. `;
            attributes.score += 4 / ePenalty;
          } else say += "Emotion group match. ";
          emotionColor = "darkolivegreen";
          emotionIcon = "👍";
        } else {
          emotionColor = "red";
          emotionIcon = "👎";
          say += ` For emotion I detected  ${categorize.value.data.categories[0].label}`;
          if (categorize.value.data.categories.length > 1) {
            for (
              var i = 1;
              i < categorize.value.data.categories.length - 1;
              i++
            ) {
              say += `,  ${categorize.value.data.categories[i].label}`;
            }
            say += `, and ${
              categorize.value.data.categories[
                categorize.value.data.categories.length - 1
              ].label
            }. `;
          } else say += ". ";
          say += ` instead of target, ${attributes.emotion[0]}. `;
        }
      } else {
        detectedEmotion = "?";
        emotionColor = "goldenrod";
        emotionIcon = "🤔";
        say += `I wasn't able to detect an emotion. `;
      }
    }

    let welcomeTextToSpeak = "<speak>" + say + "</speak>";
    if (!supportsAPL(handlerInput))
      say += ` Your score is now ${attributes.score}. `;
    say += "Say, continue, to keep playing. ";
    attributes.doOver = false;

    if (supportsAPL(handlerInput)) {
      const setResults = {
        type: "SetValue",
        componentId: "Globals",
        property: "detectedValues",
        value: {
          detectedTopic: detectedTopic,
          detectedBehavior: detectedBehavior,
          detectedEmotion: detectedEmotion,
          topicColor: topicColor,
          behaviorColor: behaviorColor,
          emotionColor: emotionColor,
          topicIcon: topicIcon,
          behaviorIcon: behaviorIcon,
          emotionIcon: emotionIcon,
          Score: attributes.score,
          results: true,
        },
      };
      const animateT1 = {
        type: "AnimateItem",
        componentId: "tBack",
        duration: 250,
        value: [
          {
            property: "transform",
            from: [
              {
                scaleX: 1,
              },
            ],
            to: [
              {
                scaleX: 0,
              },
            ],
          },
        ],
      };
      const animateT2 = {
        type: "AnimateItem",
        componentId: "tResults",
        duration: 250,
        value: [
          {
            property: "transform",
            from: [
              {
                scaleX: 0,
              },
            ],
            to: [
              {
                scaleX: 1,
              },
            ],
          },
        ],
      };
      const animateB1 = {
        type: "AnimateItem",
        componentId: "bBack",
        duration: 250,
        value: [
          {
            property: "transform",
            from: [
              {
                scaleX: 1,
              },
            ],
            to: [
              {
                scaleX: 0,
              },
            ],
          },
        ],
      };
      const animateB2 = {
        type: "AnimateItem",
        componentId: "bResults",
        duration: 250,
        value: [
          {
            property: "transform",
            from: [
              {
                scaleX: 0,
              },
            ],
            to: [
              {
                scaleX: 1,
              },
            ],
          },
        ],
      };
      const animateE1 = {
        type: "AnimateItem",
        componentId: "eBack",
        duration: 250,
        value: [
          {
            property: "transform",
            from: [
              {
                scaleX: 1,
              },
            ],
            to: [
              {
                scaleX: 0,
              },
            ],
          },
        ],
      };
      const animateE2 = {
        type: "AnimateItem",
        componentId: "eResults",
        duration: 250,
        value: [
          {
            property: "transform",
            from: [
              {
                scaleX: 0,
              },
            ],
            to: [
              {
                scaleX: 1,
              },
            ],
          },
        ],
      };
      const myAPLADoc = require("./resultsAPLA.json");
      handlerInput.responseBuilder.speak(
        sayRandom(["Let's see. ", "All right. ", "OK. ", "Got it. "])
      );

      handlerInput.responseBuilder.addDirective({
        type: "Alexa.Presentation.APL.ExecuteCommands",
        token: "targetToken",
        commands: [
          setResults,
          hasTopic ? animateT1 : "",
          hasTopic ? animateT2 : "",
          hasBehavior ? animateB1 : "",
          hasBehavior ? animateB2 : "",
          hasEmotion ? animateE1 : "",
          hasEmotion ? animateE2 : "",
        ],
      });
      handlerInput.responseBuilder.addDirective({
        type: "Alexa.Presentation.APLA.RenderDocument",
        document: myAPLADoc,
        datasources: {
          say: say,
        },
      });

      return handlerInput.responseBuilder
        .reprompt("Say, repeat, to hear that again.")
        .getResponse();
    }
    return handlerInput.responseBuilder
      .speak(
        sayRandom(["Let's see. ", "All right. ", "OK. ", "Got it. "]) + say
      )
      .reprompt(reSay)
      .getResponse();
  },
};

const levelIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "levelIntent"
    );
  },
  handle(handlerInput) {
    const level =
      handlerInput.requestEnvelope.request.intent.slots.level.resolutions
        .resolutionsPerAuthority[0].values[0].value.name;
    const speakOutput = `Game set to level ${level}. Say, continue, to proceed. `;
    var attributes = handlerInput.attributesManager.getSessionAttributes();
    attributes.level = level;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.HelpIntent"
    );
  },
  handle(handlerInput) {
    const speakOutput =
      "Typical Topical uses analysis from Expert dot A.I. to determine the topic, expressed emotion, and described behavior from your statements. In each turn, you will be given targets to meet for each of these areas, and will score points based on how cloce you come to meeting the targets using Expert dot A.I.'s analysis. More detailed instructions were sent to a card in your Alexa app. Say, continue, to proceed. ";

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
};
const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      (Alexa.getIntentName(handlerInput.requestEnvelope) ===
        "AMAZON.CancelIntent" ||
        Alexa.getIntentName(handlerInput.requestEnvelope) ===
          "AMAZON.StopIntent")
    );
  },
  handle(handlerInput) {
    var attributes = handlerInput.attributesManager.getSessionAttributes();
    const say = `Your final score was ${
      attributes.hasOwnProperty("score") ? attributes.score : 0
    }. Goodbye!`;
    if (supportsAPL(handlerInput)) {
      const myDoc = require("./goodbye.json");
      return handlerInput.responseBuilder
        .speak(say)
        .addDirective({
          type: "Alexa.Presentation.APL.RenderDocument",
          token: "launchToken",
          document: myDoc,
          datasources: {
            endData: {
              type: "object",
              properties: {
                score: attributes.hasOwnProperty("score")
                  ? attributes.score
                  : 0,
              },
            },
          },
        })
        .withShouldEndSession(true)
        .getResponse();
    }

    return handlerInput.responseBuilder
      .speak(say)
      .withShouldEndSession(true)
      .getResponse();
  },
};
const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) ===
      "SessionEndedRequest"
    );
  },
  handle(handlerInput) {
    // Any cleanup logic goes here.
    return handlerInput.responseBuilder.getResponse();
  },
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest"
    );
  },
  handle(handlerInput) {
    const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
    const speakOutput = `You just triggered ${intentName}. Goodbye`;

    return (
      handlerInput.responseBuilder
        .speak(speakOutput)
        .withShouldEndSession(true)
        //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
        .getResponse()
    );
  },
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`~~~~ Error handled: ${error.stack}`);
    const speakOutput = `Sorry, I had trouble doing what you asked. Please try again.`;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
};

function supportsAPL(handlerInput) {
  const supportedInterfaces =
    handlerInput.requestEnvelope.context.System.device.supportedInterfaces;
  const aplInterface = supportedInterfaces["Alexa.Presentation.APL"];
  return aplInterface != null && aplInterface !== undefined;
}

function sayRandom(theArray) {
  return theArray[Math.floor(Math.random() * theArray.length)];
  //return theArray[(theArray.length * Math.random()) | 0];
}

function randomIntFromInterval(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const capitalize = (s) => {
  if (typeof s !== "string") return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

function getNull() {
  return "";
}

async function getAnalyze(handlerInput, query) {
  var attributes = handlerInput.attributesManager.getSessionAttributes();
  var config = {
    timeout: 6500, // timeout api call before we reach Alexa's 8 sec timeout, or set globally via axios.defaults.timeout
    headers: {
      Authorization: "Bearer " + attributes.token,
      "Content-Type": "application/json; charset=utf-8",
    },
  };
  var url = "https://nlapi.expert.ai/v2/analyze/standard/en";
  var data = {
    document: {
      text: query,
    },
  };
  const options = {
    method: "POST",
    headers: config.headers,
    data: data,
    url: url,
  };

  const res = await axios(options);
  return res.data;
}

async function getCategorize(handlerInput, query) {
  var attributes = handlerInput.attributesManager.getSessionAttributes();
  var config = {
    timeout: 6500, // timeout api call before we reach Alexa's 8 sec timeout, or set globally via axios.defaults.timeout
    headers: {
      Authorization: "Bearer " + attributes.token,
      "Content-Type": "application/json; charset=utf-8",
    },
  };
  var url =
    "https://nlapi.expert.ai/v2/categorize/emotional-traits/en?features=extradata";
  var data = {
    document: {
      text: query,
    },
  };
  const options = {
    method: "POST",
    headers: config.headers,
    data: data,
    url: url,
  };

  const res = await axios(options);

  return res.data;
}

async function getBehavioral(handlerInput, query) {
  var attributes = handlerInput.attributesManager.getSessionAttributes();
  var config = {
    timeout: 6500, // timeout api call before we reach Alexa's 8 sec timeout, or set globally via axios.defaults.timeout
    headers: {
      Authorization: "Bearer " + attributes.token,
      "Content-Type": "application/json; charset=utf-8",
    },
  };

  var url =
    "https://nlapi.expert.ai/v2/categorize/behavioral-traits/en?features=extradata";
  var data = {
    document: {
      text: query,
    },
  };
  const options = {
    method: "POST",
    headers: config.headers,
    data: data,
    url: url,
  };

  const res = await axios(options);

  return res.data;
}

async function getExpertToken() {
  var config = {
    timeout: 6500, // timeout api call before we reach Alexa's 8 sec timeout, or set globally via axios.defaults.timeout
    headers: {
      "Content-Type": "application/json",
    },
  };

  var url = "https://developer.expert.ai/oauth2/token";
  var data = {
    username: process.env.EUSERNAME,
    password: process.env.EPASSWORD,
  };
  const options = {
    method: "POST",
    headers: config.headers,
    data: data,
    url: url,
  };

  const res = await axios(options);
  return res.data;
}

const TokenIntercept = {
  async process(handlerInput) {
    var attributes = handlerInput.attributesManager.getSessionAttributes();
    attributes.token = await getExpertToken();
    handlerInput.attributesManager.setSessionAttributes(attributes);
  },
};

const RequestLog = {
  async process(handlerInput) {
    console.log(
      "REQUEST ENVELOPE = " + JSON.stringify(handlerInput.requestEnvelope)
    );
  },
};

const ResponseLog = {
  process(handlerInput) {
    console.log(
      "RESPONSE BUILDER = " +
        JSON.stringify(handlerInput.responseBuilder.getResponse())
    );
  },
};

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    startGameHandler,
    repeatIntentHandler,
    levelIntentHandler,
    utteranceHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler,
    IntentReflectorHandler // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
  )
  .addErrorHandlers(ErrorHandler)
  .addRequestInterceptors(RequestLog)
  .addRequestInterceptors(TokenIntercept)
  .addResponseInterceptors(ResponseLog)
  .lambda();
