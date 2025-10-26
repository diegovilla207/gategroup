import { useState, useRef, useEffect } from 'react';

const GEMINI_API_KEY = "AIzaSyAxGw0arzRYw_VxnH73NIeK7wnOEJ28yLY";
const API_URL = 'http://localhost:3001';

export default function AIAssistant({ dashboardData, isOpen, onToggle, user }) {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: '👋 Hello! I\'m your AI Assistant for the SupervisorDashboard. I can help you analyze performance metrics, identify trends, and provide recommendations. What would you like to know?'
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const generateContextPrompt = () => {
        if (!dashboardData) return '';

        const { performanceTrends, errorDistribution, employeeMetrics, alerts, sustainabilityMetrics } = dashboardData;

        return `
You are an AI assistant for a supervisor dashboard at GateGroup SmartStation, an airline catering inventory management system.

CURRENT DASHBOARD CONTEXT:
${performanceTrends && performanceTrends.length > 0 ? `
Recent Performance Trends (Last ${performanceTrends.length} days):
- Latest error rate: ${performanceTrends[0]?.errorRate || 0}%
- Average session time: ${performanceTrends[0]?.avgTime || 0} minutes
- Total items processed: ${performanceTrends[0]?.items || 0}
` : ''}

${employeeMetrics && employeeMetrics.length > 0 ? `
Employee Performance Summary (${employeeMetrics.length} employees):
${employeeMetrics.slice(0, 5).map(emp =>
    `- ${emp.fullName}: ${emp.itemsPerHour} items/hour, ${emp.errorRate}% error rate, ${emp.accuracyScore}% accuracy`
).join('\n')}
` : ''}

${errorDistribution && errorDistribution.length > 0 ? `
Error Distribution:
${errorDistribution.map(err =>
    `- ${err.type}: ${err.count} occurrences (${err.percentage}%)`
).join('\n')}
` : ''}

${alerts && alerts.length > 0 ? `
Active Alerts (${alerts.length}):
${alerts.slice(0, 3).map(alert =>
    `- [${alert.severity}] ${alert.title}`
).join('\n')}
` : ''}

${sustainabilityMetrics ? `
Sustainability Impact (Last 30 days):
- Errors prevented: ${sustainabilityMetrics.errorsPrevented}
- Waste reduced: ${sustainabilityMetrics.wasteReduction.toFixed(2)} kg
- Time saved: ${sustainabilityMetrics.timeSaved} minutes
- Cost savings: $${sustainabilityMetrics.costSavings.toFixed(2)}
` : ''}

Your role is to:
1. Analyze performance data and identify trends
2. Provide actionable recommendations for improvement
3. Identify training needs based on error patterns
4. Suggest workflow optimizations
5. Help supervisors make data-driven decisions

Be concise, professional, and focus on actionable insights. Use emojis sparingly for emphasis.
`;
    };

    const sendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage = inputMessage.trim();
        setInputMessage('');

        // Add user message
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const contextPrompt = generateContextPrompt();

            // Use same model/endpoint shape as SmartBottleAnalyzer
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;

            // Build a single prompt that includes the dashboard context and the short conversation
            const conversationText = messages.concat([{ role: 'user', content: userMessage }])
                .map(m => `${m.role.toUpperCase()}: ${m.content}`)
                .join('\n');

            const prompt = `${contextPrompt}\n\nConversation:\n${conversationText}\n\nAssistant:`;

            const payload = {
                contents: [
                    {
                        parts: [
                            { text: prompt }
                        ]
                    }
                ],
                generationConfig: {
                    maxOutputTokens: 800,
                    temperature: 0.3
                }
            };

            const response = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            // Parse response like SmartBottleAnalyzer
            const result = await response.json();

            if (!response.ok) {
                const errMsg = result?.error?.message || response.statusText;
                console.error('Gemini API error', errMsg, result);
                throw new Error(errMsg || 'Unknown API error');
            }

            if (!result.candidates || !result.candidates[0].content || !result.candidates[0].content.parts[0].text) {
                console.error('Unexpected Gemini response shape', result);
                throw new Error('Unexpected API response shape');
            }

            const aiText = result.candidates[0].content.parts[0].text;

            // Add AI response to UI
            setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);

            // Send lightweight analytics (no message content)
            fetch(`${API_URL}/api/analytics/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    sessionId: `chat-${Date.now()}`,
                    userId: user?.id || user?.username,
                    messageCount: messages.length + 1,
                    timestamp: new Date().toISOString()
                })
            }).catch(err => console.error('Failed to send analytics', err));

        } catch (err) {
            console.error('Error sending message:', err);
            setMessages(prev => [...prev, { role: 'assistant', content: '❌ Sorry, I encountered an error. Please try again. Error: ' + (err.message || err) }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const quickActions = [
        { label: 'Analyze Performance', prompt: 'Analyze the current performance trends and identify any concerns.' },
        { label: 'Training Needs', prompt: 'Who needs training and in what areas based on current metrics?' },
        { label: 'Reduce Errors', prompt: 'What specific actions can we take to reduce error rates?' },
        { label: 'Improve Efficiency', prompt: 'Suggest ways to improve overall workflow efficiency.' }
    ];

    if (!isOpen) {
        return (
            <button
                onClick={onToggle}
                className="fixed bottom-6 right-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-full p-4 shadow-2xl transition-all duration-300 transform hover:scale-110 z-50"
                title="Open AI Assistant"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    AI
                </span>
            </button>
        );
    }

    return (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-gray-800 border-l border-amber-500/20 shadow-2xl flex flex-col z-40">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 rounded-full p-2">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg">AI Assistant</h3>
                        <p className="text-amber-100 text-xs">Powered by Gemini</p>
                    </div>
                </div>
                <button
                    onClick={onToggle}
                    className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-xl p-3 ${
                            msg.role === 'user'
                                ? 'bg-amber-500 text-white'
                                : 'bg-gray-700 text-gray-100'
                        }`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-700 rounded-xl p-3">
                            <div className="flex gap-2">
                                <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length === 3 && (
                <div className="p-4 border-t border-gray-700">
                    <p className="text-gray-400 text-xs mb-2">Quick Actions:</p>
                    <div className="grid grid-cols-2 gap-2">
                        {quickActions.map((action, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setInputMessage(action.prompt);
                                    setTimeout(() => sendMessage(), 100);
                                }}
                                className="bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 px-3 rounded-lg transition-all"
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-700">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me anything..."
                        disabled={isLoading}
                        className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!inputMessage.trim() || isLoading}
                        className="bg-amber-500 hover:bg-amber-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
