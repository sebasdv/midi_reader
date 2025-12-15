import React from 'react';
import { useMIDI } from '../hooks/useMIDI';
import './MIDIReader.css';

export function MIDIReader() {
    const { inputs, selectedInputId, setSelectedInputId, messages } = useMIDI();

    return (
        <div className="midi-reader">
            <header className="midi-header">
                <h1>MIDI Monitor</h1>
                <div className="controls">
                    <label htmlFor="midi-input">Input Device: </label>
                    <select
                        id="midi-input"
                        value={selectedInputId || ''}
                        onChange={(e) => setSelectedInputId(e.target.value)}
                        disabled={inputs.length === 0}
                    >
                        {inputs.length === 0 && <option value="">No MIDI inputs detected</option>}
                        {inputs.map(input => (
                            <option key={input.id} value={input.id}>{input.name}</option>
                        ))}
                    </select>
                </div>
            </header>

            <div className="visualization-area">
                {/* Simple Visualizer for the latest message */}
                {messages.length > 0 && messages[0].type.includes('Note') && (
                    <div className={`visualizer-note ${messages[0].type === 'Note On' ? 'active' : ''}`}>
                        {messages[0].note}
                    </div>
                )}
            </div>

            <div className="log-container">
                <div className="log-header">
                    <span>Time</span>
                    <span>Type</span>
                    <span>Channel</span>
                    <span>Data / Note</span>
                    <span>Velocity / Value</span>
                </div>
                <div className="log-list">
                    {messages.length === 0 && <div className="log-placeholder">Waiting for MIDI data...</div>}
                    {messages.map((msg) => (
                        <div key={msg.id} className={`log-item ${msg.type.replace(/\s+/g, '-').toLowerCase()}`}>
                            <span className="timestamp">{Math.round(msg.timestamp)} ms</span>
                            <span className="type">{msg.type}</span>
                            <span className="channel">{msg.channel}</span>
                            <span className="note">{msg.note}</span>
                            <span className="velocity">{msg.velocity}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
