import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  ShieldCheck,
  ExternalLink,
  Bot,
  User,
  ArrowRight,
  Shield,
  Info,
} from 'lucide-react';
import { useFindingsStore } from '../../state/useFindingsStore';
import { Button } from '../ui/Button';

export const AssistantSlideOver: React.FC = () => {
  const {
    assistantOpen,
    setAssistantOpen,
    assistantMessages,
    sendAssistantMessage,
    selectFinding,
  } = useFindingsStore();

  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    'Why did my bill increase this month?',
    'What are my top security risks?',
    'Show me unencrypted storage volumes',
    'How do I fix Bastion Port 22 SSH?',
  ];

  useEffect(() => {
    if (assistantOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [assistantMessages, assistantOpen]);

  if (!assistantOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isSending) return;

    setInput('');
    setIsSending(true);
    await sendAssistantMessage(text);
    setIsSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setAssistantOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg glass-panel-elevated border-l border-border flex flex-col shadow-2xl animate-in slide-in-from-right duration-250">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-ai-violet to-ai-cyan p-0.5 flex items-center justify-center shadow-glow-ai">
                <div className="w-full h-full bg-[#0B0F14] rounded-[6px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-ai-cyan" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-text-primary">CloudGuard AI Advisor</h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                    Grounded
                  </span>
                </div>
                <div className="text-[11px] text-text-muted flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-ai-cyan animate-pulse" />
                  Claude 3.5 Sonnet · Guardrails Active
                </div>
              </div>
            </div>

            <button
              onClick={() => setAssistantOpen(false)}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
              aria-label="Close assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Guardrail Disclaimer Banner */}
          <div className="px-4 py-2 bg-ai-violet/5 border-b border-ai-violet/10 flex items-center justify-between text-[11px] text-purple-300">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-ai-cyan shrink-0" />
              <span>Answers restricted strictly to your account's DynamoDB findings.</span>
            </div>
            <span className="font-mono text-[10px] opacity-75">PII Blocked</span>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {assistantMessages.map((msg) => {
              const isAssistant = msg.role === 'assistant';

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isAssistant ? 'items-start' : 'items-start flex-row-reverse'}`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${
                      isAssistant
                        ? 'bg-ai-violet/20 border border-ai-violet/30 text-ai-cyan'
                        : 'bg-surface-elevated border border-border text-text-primary'
                    }`}
                  >
                    {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div className={`space-y-2 max-w-[85%] ${isAssistant ? '' : 'text-right'}`}>
                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isAssistant
                          ? 'bg-surface-elevated/80 border border-border text-text-primary whitespace-pre-wrap'
                          : 'bg-gradient-to-r from-ai-violet to-purple-600 text-white rounded-tr-none'
                      }`}
                    >
                      {msg.content}
                      {msg.isStreaming && (
                        <span className="inline-block w-1.5 h-3 ml-1 bg-ai-cyan animate-pulse" />
                      )}
                    </div>

                    {/* Grounded Citation Chips */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-1.5">
                        {msg.citations.map((cite) => (
                          <button
                            key={cite.id}
                            onClick={() => {
                              selectFinding(cite.id);
                              setAssistantOpen(false);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface border border-border text-[11px] font-mono text-ai-cyan hover:border-ai-cyan/50 hover:bg-surface-elevated transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">{cite.title}</span>
                            {cite.saving > 0 && (
                              <span className="text-emerald-400 font-bold">
                                (${cite.saving.toFixed(0)})
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="text-[10px] text-text-muted px-1">{msg.timestamp}</div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts (when idle) */}
          <div className="p-3 border-t border-border bg-surface/40">
            <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">
              Suggested Questions
            </div>
            <div className="flex flex-wrap gap-1.5">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-surface-elevated hover:bg-surface border border-border text-text-secondary hover:text-text-primary transition-colors text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Input */}
          <div className="p-3 border-t border-border bg-surface">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask about your costs, security, or remediation..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isSending}
                className="flex-1 bg-surface-elevated border border-border rounded-lg px-3.5 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-ai-violet transition-colors"
              />
              <Button
                type="submit"
                variant="ai"
                size="icon"
                disabled={!input.trim() || isSending}
                className="shrink-0 h-9 w-9"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
