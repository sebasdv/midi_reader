import React from 'react';
import { useMIDI } from '../hooks/useMIDI';
import './MIDIReader.css';

export function MIDIReader() {
    const { inputs, selectedInputId, setSelectedInputId, messages, isRecording, startRecording, stopRecording, downloadLog } = useMIDI();

    return (
        <div className="midi-reader">
            <header className="midi-header">
                <div className="glitch-wrapper">
                    <h1 className="glitch-text" data-text="MIDI READER v0.1">MIDI READER v0.1</h1>
                    <span className="subtitle">REAL-TIME MIDI DATA MONITOR // V0.1</span>
                </div>

                <div className="controls">
                    <div className="recording-controls">
                        {!isRecording ? (
                            <button className="btn-record" onClick={startRecording}>[REC]</button>
                        ) : (
                            <button className="btn-stop" onClick={stopRecording}>[STOP_REC]</button>
                        )}
                        <button className="btn-download" onClick={downloadLog}>[EXP_LOG]</button>
                    </div>

                    <label htmlFor="midi-input">DEV_ID: </label>
                    <div className="select-wrapper">
                        <select
                            id="midi-input"
                            value={selectedInputId || ''}
                            onChange={(e) => setSelectedInputId(e.target.value)}
                            disabled={inputs.length === 0}
                        >
                            {inputs.length === 0 && <option value="">NO_DEV_DETECTED</option>}
                            {inputs.map(input => (
                                <option key={input.id} value={input.id}>{input.name.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </header>

            <div className="visualization-area">
                <div className="pad-grid">
                    {/* Visualizing notes as Drum Pads */}
                    <div className={`drum-pad ${messages.length > 0 && messages[0].type === 'Note On' ? 'active' : ''} ${messages.length > 0 && messages[0].type.includes('Note') ? 'loaded' : ''}`}>
                        {messages.length > 0 && messages[0].type.includes('Note') ? messages[0].note : '00'}
                    </div>
                </div>
            </div>

            <div className="log-container">
                <div className="terminal-header">
                    <span>TIM_STAMP</span>
                    <span>OP_TYPE</span>
                    <span>CH</span>
                    <span>DATA_HEX</span>
                    <span>VEL_VAL</span>
                </div>
                <div className="log-list">
                    {messages.length === 0 && <div className="log-placeholder">{" >>> "} WAITING_FOR_DATA_STREAM...</div>}
                    {messages.map((msg) => (

                        <div key={msg.id} className={`log-item ${msg.type.replace(/\s+/g, '-').toLowerCase()}`}>
                            <span className="timestamp">{Math.round(msg.timestamp)}ms</span>
                            <span className="type">{msg.type.toUpperCase()}</span>
                            <span className="channel">{msg.channel.toString().padStart(2, '0')}</span>
                            <span className="note">{msg.note}</span>
                            <span className="velocity">{msg.velocity}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

}
