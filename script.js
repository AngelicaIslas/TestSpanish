// Define variables for the icons and melodic alarm file paths
const icons = {
    CardiovascularHigh: "audio/Icons/HPcardio.mp3",
    CardiovascularMedium: "audio/Icons/MPcardio.mp3",
    VentilationHigh: "audio/Icons/HPvent.mp3",
    VentilationMedium: "audio/Icons/MPvent.mp3",
    DrugAdministrationHigh: "audio/Icons/HPdrug.mp3",
    DrugAdministrationMedium: "audio/Icons/MPdrug.mp3"
};

const melodics = {
    CardiovascularHigh: "audio/Melodic/M_HPcardio.mp3",
    CardiovascularMedium: "audio/Melodic/M_MPcardio.mp3",
    VentilationHigh: "audio/Melodic/M_HPvent.mp3",
    VentilationMedium: "audio/Melodic/M_MPvent.mp3",
    DrugAdministrationHigh: "audio/Melodic/M_HPdrug.mp3",
    DrugAdministrationMedium: "audio/Melodic/M_MPdrug.mp3"
};

let groupNumber = 0;
let personalCode = '';  
let currentDesign = "icons";
let stepNumber = 1;
let repetitionCount = 0;
let logData = [];
let nasaTlxData = {};  
let alarm1, alarm2;
let alarm1Interval, alarm2Interval; // Declare interval variables
let alarm1Audio, alarm2Audio;
let testStartTime, stepStartTime, stepEndTime; 

let participantSelection = {
    alarm1: { category: 'Not selected', priority: 'Not selected', design: '' },
    alarm2: { category: 'Not selected', priority: 'Not selected', design: '' }
};

const groupMap = {
    1: ["icons", "melodic", "combined"],
    2: ["melodic", "combined", "icons"],
    3: ["combined", "icons", "melodic"]
};

document.getElementById("start-learning").addEventListener("click", startLearningPhase);
document.getElementById("skip-learning").addEventListener("click", skipLearningPhase);

function startLearningPhase() {
    const groupInput = document.getElementById("group-number").value;
    const personalCodeInput = document.getElementById("personal-code").value;

    if ((groupInput === "1" || groupInput === "2" || groupInput === "3") && personalCodeInput) {
        groupNumber = parseInt(groupInput);
        personalCode = personalCodeInput;  
        document.getElementById("group-selection").style.display = "none";
        document.getElementById("learning-phase").style.display = "block";
        startAudioSequence("icons");
    } else {
        alert("Por favor ingrese un número de grupo válido (1, 2 o 3) y su código personal.");//alert("Please enter a valid group number (1, 2, or 3) and your personal code.");
    }
}

function skipLearningPhase() {
    const groupInput = document.getElementById("group-number").value;
    const personalCodeInput = document.getElementById("personal-code").value;  

    if ((groupInput === "1" || groupInput === "2" || groupInput === "3") && personalCodeInput) {
        groupNumber = parseInt(groupInput);
        personalCode = personalCodeInput;  
        document.getElementById("group-selection").style.display = "none";
        document.getElementById("test-phase").style.display = "block";  
        startTestStep();
    } else {
        alert("Por favor ingrese un número de grupo válido (1, 2 o 3) y su código personal.");//alert("Please enter a valid group number (1, 2, or 3) and your personal code.");
    }
}

// Play audio sequence during learning phase
function startAudioSequence(design) {
    currentDesign = design;
    playAudioSequence();
}

function playAudioSequence() {
    const audioQueue = [
        { category: "Cardiovascular", priority: "Alta", src: getAudio("Cardiovascular", "High") },
        { category: "Cardiovascular", priority: "Media", src: getAudio("Cardiovascular", "Medium") },
        { category: "Ventilación", priority: "Alta", src: getAudio("Ventilation", "High") },
        { category: "Ventilación", priority: "Media", src: getAudio("Ventilation", "Medium") },
        { category: "Administración de Medicamentos", priority: "Alta", src: getAudio("DrugAdministration", "High") },
        { category: "Administración de Medicamentos", priority: "Media", src: getAudio("DrugAdministration", "Medium") }
    ];

    playSequence(audioQueue, 3, () => {
        if (currentDesign === "icons") {
            setTimeout(() => startAudioSequence("melodic"), 3000);
        } else {
            document.getElementById("go-to-test").style.display = "block";
        }
    });
}

function playSequence(queue, repetitions, callback) {
    let count = 0;
    function playNext() {
        if (count >= repetitions) {
            callback();
            return;
        }
        count++;
        let index = 0;
        function playAudio() {
            if (index >= queue.length) {
                setTimeout(playNext, 1000);
                return;
            }
            const { category, priority, src } = queue[index];
            document.getElementById("category").textContent = category;
            document.getElementById("priority").textContent = priority;
            document.getElementById("design").textContent = currentDesign === "icons" ? "Íconos" : "Melódico";//currentDesign === "icons" ? "Icons" : "Melodic";
            const audio = new Audio(src);
            audio.play();
            audio.onended = () => {
                index++;
                setTimeout(playAudio, 1000);
            };
        }
        playAudio();
    }
    playNext();
}

function getAudio(category, priority) {
    const designSet = currentDesign === "icons" ? icons : melodics;
    return designSet[`${category}${priority}`];
}

// Handle test phase and logging
document.getElementById("go-to-test").addEventListener("click", () => {
    logInteraction("Go to Test Phase", {});
    document.getElementById("learning-phase").style.display = "none";
    document.getElementById("test-phase").style.display = "block";
    testStartTime = new Date().toISOString();
    logData.push({
        event: "Test Start",
        group: groupNumber,
        personalCode: personalCode,  
        time: testStartTime
    });
    startTestStep();
});

function startTestStep() {
    repetitionCount = 0;
    currentDesign = groupMap[groupNumber][stepNumber - 1];
    stepStartTime = new Date().toISOString(); 

    const stepType = currentDesign === "combined" ? "Combined" : (currentDesign === "icons" ? "Icons" : "Melodic");

    logData.push({
        event: "Step Start",
        step: stepNumber,
        group: groupNumber,
        design: currentDesign,
        stepType: stepType,  
        personalCode: personalCode,  
        startTime: stepStartTime, 
        time: new Date().toISOString()
    });

    document.getElementById("group-display").textContent = groupNumber;
    document.getElementById("step-number").textContent = `${stepNumber}/3`;
    document.getElementById("design-sequence").textContent = stepType;

    toggleDropdowns(true);
    playTestPair();
}

function playTestPair() {
    stopPlayingAlarms();

    participantSelection.alarm1 = { category: 'Not selected', priority: 'Not selected', design: '' };
    participantSelection.alarm2 = { category: 'Not selected', priority: 'Not selected', design: '' };

    document.getElementById("alarm1-category").value = '';
    document.getElementById("alarm1-priority").value = '';
    document.getElementById("alarm2-category").value = '';
    document.getElementById("alarm2-priority").value = '';

    const stepDesign = groupMap[groupNumber][stepNumber - 1];
    document.getElementById("repetition-count").textContent = repetitionCount + 1;

    if (stepDesign === "combined") {
        // Randomly decide the design for Alarm 1
        const randomDesign = Math.random() < 0.5 ? "icons" : "melodics"; // 50% chance for either design
        
        // Get a random alarm for Alarm 1 based on the chosen design
        alarm1 = getRandomAlarm(randomDesign);
        
        // Get a different category for Alarm 2, ensuring different design
        alarm2 = getRandomAlarm(randomDesign === "icons" ? "melodics" : "icons", alarm1.category);
        
        // Set the design in participantSelection
        participantSelection.alarm1.design = randomDesign === "icons" ? "Icons" : "Melodic";
        participantSelection.alarm2.design = randomDesign === "icons" ? "Melodic" : "Icons";
    } else {
        // If not combined, get non-repeating alarm pair
        [alarm1, alarm2] = getNonRepeatingAlarmPair(stepDesign);
        participantSelection.alarm1.design = stepDesign; // Store the design based on the step
        participantSelection.alarm2.design = stepDesign; // Adjust based on your logic
    }

    logInteraction("Repetition Start", { 
        repetition: repetitionCount + 1,
        playedAlarms: {
            alarm1: { category: alarm1.category, priority: alarm1.priority, design: participantSelection.alarm1.design },
            alarm2: { category: alarm2.category, priority: alarm2.priority, design: participantSelection.alarm2.design }
        },
        stepType: stepDesign === "combined" ? "Combined" : (stepDesign === "icons" ? "Icons" : "Melodic")
    });

    document.getElementById("alarm1-info").textContent = `Category: ${alarm1.category}, Priority: ${alarm1.priority}`;
    document.getElementById("alarm2-info").textContent = `Category: ${alarm2.category}, Priority: ${alarm2.priority}`;
    playPairAlarms();

    document.getElementById("confirm-selection").style.display = "block";
    document.getElementById("next-repetition").style.display = "none";
}

function stopPlayingAlarms() {
    if (alarm1Audio) {
        alarm1Audio.pause();
        alarm1Audio.currentTime = 0;
    }
    if (alarm2Audio) {
        alarm2Audio.pause();
        alarm2Audio.currentTime = 0;
    }
    clearInterval(alarm1Interval);
    clearInterval(alarm2Interval);
}

function getNonRepeatingAlarmPair(design) {
    const categories = ["Cardiovascular", "Ventilation", "DrugAdministration"];
    const priorities = ["High", "Medium"];

    let alarm1Category = categories[Math.floor(Math.random() * categories.length)];
    let alarm1Priority = priorities[Math.floor(Math.random() * priorities.length)];

    let alarm2Category;
    do {
        alarm2Category = categories[Math.floor(Math.random() * categories.length)];
    } while (alarm2Category === alarm1Category);  

    const alarm2Priority = alarm1Priority === "High" ? "Medium" : "High";

    return [
        { category: alarm1Category, priority: alarm1Priority, src: getAudioFromDesign(alarm1Category, alarm1Priority, design) },
        { category: alarm2Category, priority: alarm2Priority, src: getAudioFromDesign(alarm2Category, alarm2Priority, design) }
    ];
}

function getRandomAlarm(design, excludeCategory) {
    const categories = ["Cardiovascular", "Ventilation", "DrugAdministration"];
    const priorities = ["High", "Medium"];
    
    let randomCategory;
    do {
        randomCategory = categories[Math.floor(Math.random() * categories.length)];
    } while (randomCategory === excludeCategory); // Ensure a different category

    const randomPriority = priorities[Math.floor(Math.random() * priorities.length)];

    return {
        category: randomCategory,
        priority: randomPriority,
        src: getAudioFromDesign(randomCategory, randomPriority, design)
    };
}

function getAudioFromDesign(category, priority, design) {
    const designSet = design === "icons" ? icons : melodics;
    return designSet[`${category}${priority}`];
}

function playPairAlarms() {
    alarm1Audio = new Audio(alarm1.src);
    alarm2Audio = new Audio(alarm2.src);

    let alarm1Length, alarm2Length;

    const setupPlayback = () => {
        // Play the first alarm immediately
        alarm1Audio.play();
        console.log(`Alarm 1 played at: ${new Date().toISOString()}`);

        // Start playing the second alarm after 1.2 seconds
        setTimeout(() => {
            alarm2Audio.play();
            console.log(`Alarm 2 played at: ${new Date().toISOString()}`);
            
            // After the first play of Alarm 2, set its interval for repetitions
            const alarm2RepeatInterval = alarm2.priority === "High" ? 2.5 : 5;

            alarm2Interval = setInterval(() => {
                alarm2Audio.currentTime = 0; // Reset to start
                alarm2Audio.play();
                console.log(`Alarm 2 played at: ${new Date().toISOString()}`);
            }, (alarm2Length + alarm2RepeatInterval) * 1000); // Convert seconds to milliseconds
        }, 1200); // 1.2 seconds after Alarm 1

        // Set repeat intervals based on priority after the alarm's duration
        const alarm1RepeatInterval = alarm1.priority === "High" ? 2.5 : 5;

        // Repeat Alarm 1 based on its priority
        alarm1Interval = setInterval(() => {
            alarm1Audio.currentTime = 0; // Reset to start
            alarm1Audio.play();
            console.log(`Alarm 1 played at: ${new Date().toISOString()}`);
        }, (alarm1Length + alarm1RepeatInterval) * 1000); // Convert seconds to milliseconds
    };

    // Event listener to get the length of Alarm 1
    alarm1Audio.addEventListener('loadedmetadata', function() {
        alarm1Length = alarm1Audio.duration; // Get duration in seconds
        console.log(`Alarm 1 length: ${alarm1Length.toFixed(2)} seconds`); // Log length
        console.log(`Alarm 1 priority: ${alarm1.priority}`); // Log priority

        // Event listener for Alarm 2 to get its length
        alarm2Audio.addEventListener('loadedmetadata', function() {
            alarm2Length = alarm2Audio.duration; // Get duration in seconds
            console.log(`Alarm 2 length: ${alarm2Length.toFixed(2)} seconds`); // Log length
            console.log(`Alarm 2 priority: ${alarm2.priority}`); // Log priority

            // Setup playback after both lengths are retrieved
            setupPlayback();
        });

        // Load the second audio to trigger loadedmetadata event
        alarm2Audio.load();
    });

    // Start loading the first audio
    alarm1Audio.load();
}

// Handle Confirm Selection
document.getElementById("confirm-selection").addEventListener("click", () => {
    const alarm1Category = document.getElementById("alarm1-category").value;
    const alarm1Priority = document.getElementById("alarm1-priority").value;
    const alarm2Category = document.getElementById("alarm2-category").value;
    const alarm2Priority = document.getElementById("alarm2-priority").value;

    if (alarm1Category && alarm1Priority && alarm2Category && alarm2Priority) {
        const correctAlarm1 = (alarm1Category === alarm1.category && alarm1Priority === alarm1.priority);
        const correctAlarm2 = (alarm2Category === alarm2.category && alarm2Priority === alarm2.priority);

        const details = {
            playedAlarms: {
                alarm1: {
                    category: alarm1.category,
                    priority: alarm1.priority,
                    design: participantSelection.alarm1.design // Reference the stored design
                },
                alarm2: {
                    category: alarm2.category,
                    priority: alarm2.priority,
                    design: participantSelection.alarm2.design // Reference the stored design
                }
            },
            participantSelection: {
                alarm1: { category: alarm1Category, priority: alarm1Priority },
                alarm2: { category: alarm2Category, priority: alarm2Priority }
            },
            correct: {
                alarm1: correctAlarm1 ? "Correct" : "Incorrect",
                alarm2: correctAlarm2 ? "Correct" : "Incorrect"
            },
            stepType: currentDesign === "combined" ? "Combined" : (currentDesign === "icons" ? "Icons" : "Melodic")
        };

        logData.push({
            event: "Check Selection",
            step: stepNumber,
            repetition: repetitionCount + 1,
            group: groupNumber,
            personalCode: personalCode,  
            ...details,
            time: new Date().toISOString()
        });

        repetitionCount++;
        stopPlayingAlarms();

        // Disable dropdowns after checking the selection
        toggleDropdowns(false);

        document.getElementById("confirm-selection").style.display = "none";

        if (repetitionCount >= 5) {
            handleStepCompletion();
        } else {
            document.getElementById("next-repetition").style.display = "block";
        }
    } else {
        alert("Please make valid selections.");
    }
});

// Function to toggle dropdowns
function toggleDropdowns(enable) {
    document.getElementById("alarm1-category").disabled = !enable;
    document.getElementById("alarm1-priority").disabled = !enable;
    document.getElementById("alarm2-category").disabled = !enable;
    document.getElementById("alarm2-priority").disabled = !enable;
}

document.getElementById("next-repetition").addEventListener("click", () => {
    toggleDropdowns(true);  
    playTestPair();
});

document.getElementById("next-step").addEventListener("click", () => {
    logInteraction("Next Step", { stepNumber });
    stepNumber++;
    document.getElementById("next-step").style.display = "none";
    startTestStep();
});

function exportToCSV() {
    const csvContent = generateCSV(logData);
    const fileName = `Group${groupNumber}_Code${personalCode}_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Log real-time selection changes (Alarm 1 and Alarm 2)
document.getElementById("alarm1-category").addEventListener("change", (event) => {
    logCategoryPrioritySelection("Alarm 1 Category Selection", "Alarm 1", event.target.value, "category");
});

document.getElementById("alarm1-priority").addEventListener("change", (event) => {
    logCategoryPrioritySelection("Alarm 1 Priority Selection", "Alarm 1", event.target.value, "priority");
});

document.getElementById("alarm2-category").addEventListener("change", (event) => {
    logCategoryPrioritySelection("Alarm 2 Category Selection", "Alarm 2", event.target.value, "category");
});

document.getElementById("alarm2-priority").addEventListener("change", (event) => {
    logCategoryPrioritySelection("Alarm 2 Priority Selection", "Alarm 2", event.target.value, "priority");
});

function logCategoryPrioritySelection(event, alarmNumber, selectedValue, type) {
    const snapshot = {
        alarm1: { ...participantSelection.alarm1 },
        alarm2: { ...participantSelection.alarm2 }
    };

    if (alarmNumber === "Alarm 1") {
        if (type === "category") {
            participantSelection.alarm1.category = selectedValue;
        } else if (type === "priority") {
            participantSelection.alarm1.priority = selectedValue;
        }
    } else if (alarmNumber === "Alarm 2") {
        if (type === "category") {
            participantSelection.alarm2.category = selectedValue;
        } else if (type === "priority") {
            participantSelection.alarm2.priority = selectedValue;
        }
    }

    const details = {
        eventType: event,
        alarmNumber: alarmNumber,
        selectedType: type,
        selectedValue: selectedValue,
        playedAlarms: {
            alarm1: { category: alarm1.category, priority: alarm1.priority },
            alarm2: { category: alarm2.category, priority: alarm2.priority }
        },
        participantSelection: snapshot,
        stepType: currentDesign === "combined" ? "Combined" : (currentDesign === "icons" ? "Icons" : "Melodic")
    };

    //console.log("Logged Interaction:", details); user selected stuff

    logInteraction(event, details);
}

// NASA-TLX Questionnaire Save
document.getElementById("save-nasa-tlx").addEventListener("click", () => {
    const mentalDemand = document.getElementById("mental-demand").value;
    const physicalDemand = document.getElementById("physical-demand").value;
    const temporalDemand = document.getElementById("temporal-demand").value;
    const performance = document.getElementById("performance").value;
    const effort = document.getElementById("effort").value;
    const frustration = document.getElementById("frustration").value;

    logData.push({
        event: "NASA-TLX",
        step: stepNumber,
        group: groupNumber,
        personalCode: personalCode,
        mentalDemand,
        physicalDemand,
        temporalDemand,
        performance,
        effort,
        frustration,
        time: new Date().toISOString()
    });

    document.getElementById("nasa-tlx").style.display = "none";

    if (stepNumber >= 3) {
        document.getElementById("finish-test").style.display = "block";
    } else {
        document.getElementById("next-step").style.display = "block";
    }
});

// CSV export function with NASA-TLX data
function generateCSV(data) {
    const headers = [
        "Event", "Group", "PersonalCode", "Step", "Repetition", "Time",
        "Played Alarm 1 Category", "Played Alarm 1 Priority",  "Played Alarm 1 Design",
        "Played Alarm 2 Category", "Played Alarm 2 Priority",  "Played Alarm 2 Design",
        "Selected Alarm 1 Category", "Selected Alarm 1 Priority", 
        "Selected Alarm 2 Category", "Selected Alarm 2 Priority", 
        "Correct Alarm 1", "Correct Alarm 2", "Step Type", "Duration",
        "Mental Demand", "Physical Demand", "Temporal Demand", 
        "Performance", "Effort", "Frustration"
    ];

    const rows = data.map(entry => [
        entry.event,
        entry.group,
        entry.personalCode,
        entry.step,
        entry.repetition || '', 
        entry.time,
        entry.playedAlarms ? entry.playedAlarms.alarm1.category : '',
        entry.playedAlarms ? entry.playedAlarms.alarm1.priority : '',
        entry.playedAlarms ? entry.playedAlarms.alarm1.design : '',
        entry.playedAlarms ? entry.playedAlarms.alarm2.category : '',
        entry.playedAlarms ? entry.playedAlarms.alarm2.priority : '',
        entry.playedAlarms ? entry.playedAlarms.alarm2.design : '',
        entry.participantSelection ? entry.participantSelection.alarm1.category || 'Not selected' : 'Not selected',
        entry.participantSelection ? entry.participantSelection.alarm1.priority || 'Not selected' : 'Not selected',
        entry.participantSelection ? entry.participantSelection.alarm2.category || 'Not selected' : 'Not selected',
        entry.participantSelection ? entry.participantSelection.alarm2.priority || 'Not selected' : 'Not selected',
        entry.correct ? entry.correct.alarm1 : '',
        entry.correct ? entry.correct.alarm2 : '',
        entry.stepType || '',
        entry.duration,
        entry.mentalDemand || '',  
        entry.physicalDemand || '',  
        entry.temporalDemand || '',  
        entry.performance || '',  
        entry.effort || '',  
        entry.frustration || ''
    ]);

    return [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
}

// Reset NASA-TLX questionnaire for each new step
function resetNASAQuestionnaire() {
    document.getElementById("mental-demand").value = 0;
    document.getElementById("physical-demand").value = 0;
    document.getElementById("temporal-demand").value = 0;
    document.getElementById("performance").value = 0;
    document.getElementById("effort").value = 0;
    document.getElementById("frustration").value = 0;
}

// Call this function when the step is completed
function handleStepCompletion() {
    stepEndTime = new Date();
    const duration = stepEndTime - new Date(stepStartTime); 

    logData.push({
        event: "Step Completion",
        step: stepNumber,
        group: groupNumber,
        personalCode: personalCode,  
        duration: duration, 
        time: new Date().toISOString()
    });

    if (stepNumber >= 3) {
        document.getElementById("next-repetition").style.display = "none";
        document.getElementById("nasa-tlx").style.display = "block";  
        resetNASAQuestionnaire();
    } else {
        document.getElementById("next-repetition").style.display = "none";
        document.getElementById("nasa-tlx").style.display = "block";  
        resetNASAQuestionnaire();
    }
}

// Finish test
document.getElementById("finish-test").addEventListener("click", () => {
    exportToCSV();  
    document.getElementById("test-phase").innerHTML = "<h2>La prueba ha terminado</h2><p>Gracias por participar</p><p>Puede cerrar la ventana ahora.</p>";
});

function logInteraction(event, details) {
    const timestamp = new Date().toISOString();
    //console.log(`Logging event: ${event} at ${timestamp} with details:`, details);  all types of events 
    //console.log(`A1: at ${timestamp} `);
    logData.push({
        event: event,
        group: groupNumber,
        personalCode: personalCode,  
        step: stepNumber,
        repetition: repetitionCount + 1,
        playedAlarms: details.playedAlarms,
        participantSelection: details.participantSelection,  
        time: timestamp,
        stepType: details.stepType || ''  
    });
}
