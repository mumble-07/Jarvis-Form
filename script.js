const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = "en-US";
recognition.interimResults = false;

let selectedVoice = "default";
let currentStep = "start";
let answers = [];
let selectedTopic = "";
let topics = {};

// Load topics from external JSON file
fetch("questions.json")
    .then((response) => response.json())
    .then((data) => {
        topics = data;
        populateTopics();
    });

const populateTopics = () => {
    const dropdown = document.getElementById("topicDropdown");
    Object.keys(topics).forEach((topic) => {
        const option = document.createElement("option");
        option.value = topic;
        option.textContent = topic;
        dropdown.appendChild(option);
    });
};

const speak = (text) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();

    if (selectedVoice === "male") {
        utterance.voice = voices.find(voice => voice.name.toLowerCase().includes("male")) || voices[0];
    } else if (selectedVoice === "female") {
        utterance.voice = voices.find(voice => voice.name.toLowerCase().includes("female")) || voices[0];
    }

    synth.speak(utterance);
};

const askQuestion = (step) => {
    const question = topics[selectedTopic][step].question;
    const choices = topics[selectedTopic][step].choices;

    // Display question and options on screen
    const questionContainer = document.getElementById("currentQuestion");
    questionContainer.innerHTML = `
        <h2>${question}</h2>
        <ul>
            ${choices.map(choice => `<li>${choice}</li>`).join("")}
        </ul>
    `;

    // Speak the question and choices
    speak(question + " Your choices are: " + choices.join(", "));
};

const processAnswer = (answer) => {
    const normalizedAnswer = answer.trim().toLowerCase();
    const validChoices = topics[selectedTopic][currentStep].choices.map(c => c.toLowerCase());

    if (validChoices.includes(normalizedAnswer)) {
        answers.push({ question: topics[selectedTopic][currentStep].question, answer });

        const nextStep = normalizedAnswer;
        if (topics[selectedTopic][nextStep]) {
            currentStep = nextStep;
            askQuestion(currentStep);
        } else {
            speak("Thank you for completing the form. Here are your answers.");
            displayAnswers();
        }
    } else {
        speak("I didn't understand that. Please choose one of the available options: " + topics[selectedTopic][currentStep].choices.join(", "));
    }
};

const startListening = () => {
    recognition.start();
};

recognition.onresult = (event) => {
    const userAnswer = event.results[0][0].transcript;
    processAnswer(userAnswer);
};

recognition.onerror = () => {
    speak("Sorry, I couldn't hear you. Please try again.");
};

const displayAnswers = () => {
    const answerContainer = document.getElementById("answers");
    answerContainer.innerHTML = "<h2>Your Answers:</h2>";
    answers.forEach((item, index) => {
        const answerElement = document.createElement("p");
        answerElement.textContent = `${index + 1}. ${item.question} - ${item.answer}`;
        answerContainer.appendChild(answerElement);
    });
};

const startForm = () => {
    if (!selectedTopic) {
        speak("Please select a topic first.");
        return;
    }
    answers = [];
    currentStep = "start";
    speak(`You selected ${selectedTopic}. Let's start.`);
    askQuestion(currentStep);
};

const restartForm = () => {
    answers = [];
    currentStep = "start";
    selectedTopic = "";
    document.getElementById("currentQuestion").innerHTML = "";
    document.getElementById("answers").innerHTML = "";
    speak("The form has been restarted. Please select a topic to begin.");
};

const selectTopic = () => {
    selectedTopic = document.getElementById("topicDropdown").value;
};

const setVoice = (voice) => {
    selectedVoice = voice;
};
