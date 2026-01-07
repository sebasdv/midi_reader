import { useState, useEffect, useRef } from 'react';

export function useMIDI() {
    const [inputs, setInputs] = useState([]);
    const [selectedInputId, setSelectedInputId] = useState(null);
    const [messages, setMessages] = useState([]);
    const accessRef = useRef(null);

    useEffect(() => {
        if (!navigator.requestMIDIAccess) {
            console.error("Web MIDI API not supported in this browser.");
            return;
        }

        navigator.requestMIDIAccess().then(access => {
            accessRef.current = access;
            updateInputs(access);
            access.onstatechange = () => updateInputs(access);
        }).catch(err => console.error('MIDI Access Failed', err));
    }, []);

    const updateInputs = (access) => {
        const inputsList = Array.from(access.inputs.values());
        setInputs(inputsList);
        // Auto-select first if none selected
        if (inputsList.length > 0) {
            // If current selection is invalid (e.g. disconnected), or none selected, pick first
            // actually, let's just pick the first one if we don't have a valid selection
            // But we can't easily check if selectedInputId is valid inside this scope without ref or dependency
            // We'll rely on the user or a simple check. 
            // For now, simpler: user must select, or we default to first.
            // Let's not force change if we have one, unless it disappeared.
            // Simplified:
            // setInputs will trigger re-render, we can check validity there if we wanted, 
            // but let's just leave it to the user or useEffect below.
        }
    };

    useEffect(() => {
        // Determine the effective input to listen to
        let input = null;
        if (accessRef.current) {
            if (selectedInputId) {
                input = accessRef.current.inputs.get(selectedInputId);
            }

            // Auto-select first if we don't have a connected input and we have inputs available
            if (!input && inputs.length > 0) {
                // This side effect in render logic might be bad, but setting state here is OK-ish or we can do it in updateInputs
            }
        }

        // Actually, doing the auto-select logic in updateInputs is cleaner, but selectedInputId is state.
        // Let's just handle the listener attachment.

        if (!input && inputs.length > 0 && !selectedInputId) {
            setSelectedInputId(inputs[0].id);
            return;
        }

        if (!input) return;

        const handleMIDIMessage = (event) => {
            const { data } = event;
            if (data.length < 2) return; // Ignore weird short messages?

            const [status, data1, data2] = data;
            const command = status >> 4;
            const channel = status & 0xF;

            let type = 'Unknown';
            let note = data1;
            let velocity = data2;

            // Note Off: 0x8 or 0x9 with velocity 0
            if (command === 0x8) {
                type = 'Note Off';
            } else if (command === 0x9) {
                type = (data2 > 0) ? 'Note On' : 'Note Off';
            } else if (command === 0xB) {
                type = 'Control Change';
                note = data1; // controller number
                velocity = data2; // value
            } else if (command === 0xE) {
                type = 'Pitch Bend';
                // data1 = LSB, data2 = MSB
            }

            const newMessage = {
                id: Date.now() + Math.random(), // Simple unique ID
                timestamp: event.timeStamp,
                data: Array.from(data),
                type,
                channel: channel + 1,
                note,
                velocity
            };

            setMessages(prev => [newMessage, ...prev].slice(0, 50));

            if (isRecordingRef.current) {
                recordingRef.current.push(newMessage);
            }
        };

        input.onmidimessage = handleMIDIMessage;

        return () => {
            if (input) input.onmidimessage = null;
        };
    }, [selectedInputId, inputs]);

    const [isRecording, setIsRecording] = useState(false);
    const isRecordingRef = useRef(false);
    const recordingRef = useRef([]);
    const [recordingStartTime, setRecordingStartTime] = useState(null);

    const startRecording = () => {
        setIsRecording(true);
        isRecordingRef.current = true;
        setRecordingStartTime(Date.now());
        recordingRef.current = [];
    };

    const stopRecording = () => {
        setIsRecording(false);
        isRecordingRef.current = false;
        const endTime = Date.now();
        // Maybe we want to persist the last session in state if we want to show it?
        // For now, we will rely on downloading it or accessing it via a helper function if needed immediately.
        console.log("Recording stopped. Events:", recordingRef.current.length);
    };

    const downloadLog = () => {
        if (recordingRef.current.length === 0) {
            alert("No recorded data to download.");
            return;
        }

        const startTimeIso = new Date(recordingStartTime).toISOString();
        const endTimeIso = new Date().toISOString();

        let fileContent = `MIDI SESSION LOG\n`;
        fileContent += `================================================================================\n`;
        fileContent += `Start Time: ${startTimeIso}\n`;
        fileContent += `End Time:   ${endTimeIso}\n`;
        fileContent += `Total Events: ${recordingRef.current.length}\n`;
        fileContent += `================================================================================\n\n`;
        fileContent += `TIMESTAMP (ms) | TYPE             | CH | NOTE | VEL | DATA (HEX)\n`;
        fileContent += `--------------------------------------------------------------------------------\n`;

        recordingRef.current.forEach(msg => {
            const time = Math.round(msg.timestamp - recordingRef.current[0].timestamp).toString().padEnd(14, ' ');
            const type = msg.type.toUpperCase().padEnd(16, ' ');
            const ch = msg.channel.toString().padStart(2, '0').padEnd(2, ' ');
            const note = (msg.note !== undefined ? msg.note : '--').toString().padEnd(4, ' ');
            const vel = (msg.velocity !== undefined ? msg.velocity : '--').toString().padEnd(3, ' ');
            const hex = msg.data.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');

            fileContent += `${time} | ${type} | ${ch} | ${note} | ${vel} | ${hex}\n`;
        });

        const blob = new Blob([fileContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `midi_log_${recordingStartTime}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return {
        inputs,
        selectedInputId,
        setSelectedInputId,
        messages,
        isRecording,
        startRecording,
        stopRecording,
        downloadLog
    };
}
