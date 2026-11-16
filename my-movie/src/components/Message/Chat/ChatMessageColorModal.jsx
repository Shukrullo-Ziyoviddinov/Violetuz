import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BUBBLE_PRESETS,
  bubbleFill,
  darkenHex,
  writeBubbleChoice,
} from './chatBubbles';
import ChatColorModal from './ChatColorModal';
import './ChatSettingsModal.css';

const isMobileSlide = () =>
  typeof window !== 'undefined' && window.innerWidth <= 768;

const ChatMessageColorModal = ({
  closing = false,
  initial,
  previewImage,
  onClose,
  onExited,
  onApply,
  closePickerRef,
}) => {
  const { t } = useTranslation();
  const [entered, setEntered] = useState(false);
  const [mode, setMode] = useState(initial?.mode === 'gradient' ? 'gradient' : 'solid');
  const [selectedId, setSelectedId] = useState(initial?.id || 'purple');
  const [incoming, setIncoming] = useState(initial?.incoming || BUBBLE_PRESETS[0].incoming);
  const [outgoing, setOutgoing] = useState(initial?.outgoing || BUBBLE_PRESETS[0].outgoing);
  const [showPicker, setShowPicker] = useState(false);
  const pickerCloseRef = useRef(null);
  const slideIn = entered && !closing;
  const exitedRef = useRef(false);
  const onExitedRef = useRef(onExited);
  onExitedRef.current = onExited;

  const finishExit = () => {
    if (exitedRef.current) return;
    exitedRef.current = true;
    onExitedRef.current?.();
  };

  useEffect(() => {
    let innerId = 0;
    const outerId = window.requestAnimationFrame(() => {
      innerId = window.requestAnimationFrame(() => setEntered(true));
    });
    return () => {
      window.cancelAnimationFrame(outerId);
      window.cancelAnimationFrame(innerId);
    };
  }, []);

  useEffect(() => {
    if (!closing) return undefined;
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const id = window.setTimeout(finishExit, reduced || !isMobileSlide() ? 0 : 380);
    return () => window.clearTimeout(id);
  }, [closing]);

  const handleTransitionEnd = (event) => {
    if (event.target !== event.currentTarget) return;
    if (event.propertyName !== 'transform') return;
    if (!closing || !isMobileSlide()) return;
    finishExit();
  };

  const choosePreset = (item) => {
    setSelectedId(item.id);
    setIncoming(item.incoming);
    setOutgoing(item.outgoing);
  };

  const chooseCustom = (value) => {
    const hex = String(value || '').trim();
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return;
    setSelectedId('custom');
    setOutgoing(hex);
    setIncoming(darkenHex(hex));
  };

  const applyChoice = () => {
    const saved = writeBubbleChoice({ id: selectedId, mode, incoming, outgoing });
    onApply?.(saved);
    onClose?.();
  };

  if (closePickerRef) {
    closePickerRef.current = showPicker ? () => pickerCloseRef.current?.() : null;
  }

  const inFill = { background: bubbleFill(incoming, mode) };
  const outFill = { background: bubbleFill(outgoing, mode) };

  return (
    <>
      <div className="chat-settings-backdrop chat-color-backdrop" onClick={onClose} />
      <div
        className={`chat-settings chat-color${slideIn ? ' chat-settings--in' : ''}`}
        onTransitionEnd={handleTransitionEnd}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-color-title"
      >
        <div className="profile-info-modal-header chat-settings-header">
          <button
            type="button"
            className="profile-info-back"
            onClick={onClose}
            aria-label={t('profile.settingsBack', 'Orqaga')}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="chat-settings-heading">
            <h2 id="chat-color-title" className="profile-info-modal-title chat-settings-title">
              Xabar ranglari
            </h2>
          </div>
          <span className="profile-info-header-spacer" aria-hidden="true" />
        </div>

        <div className="chat-settings-body">
          <div className="chat-settings-scroll chat-color-scroll">
            <div
              className="chat-settings-preview chat-color-preview"
              style={{ backgroundImage: `url(${previewImage})` }}
            >
              <div className="chat-settings-bubble chat-settings-bubble--in">
                <span className="chat-settings-avatar" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21a8 8 0 0 0-16 0" />
                    <circle cx="12" cy="8" r="4" />
                  </svg>
                </span>
                <span className="chat-settings-bubble-card" style={inFill}>
                  Salom! <span aria-hidden="true">👋</span>
                  <span className="chat-settings-bubble-time">20:45</span>
                </span>
              </div>
              <div className="chat-settings-bubble chat-settings-bubble--out">
                <span className="chat-settings-bubble-card" style={outFill}>
                  Qanday yangiliklar? <span aria-hidden="true">😎</span>
                  <span className="chat-settings-bubble-time">20:46</span>
                </span>
              </div>
            </div>

            <h3 className="chat-settings-section">Skrin ko‘rinishi</h3>
            <div className="chat-color-modes">
              <button
                type="button"
                className={`chat-color-mode${mode === 'solid' ? ' is-on' : ''}`}
                aria-pressed={mode === 'solid'}
                onClick={() => setMode('solid')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Oddiy
              </button>
              <button
                type="button"
                className={`chat-color-mode${mode === 'gradient' ? ' is-on' : ''}`}
                aria-pressed={mode === 'gradient'}
                onClick={() => setMode('gradient')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M12 3l7 4v5c0 4.2-2.8 7.4-7 9-4.2-1.6-7-4.8-7-9V7l7-4z" />
                </svg>
                Gradient
              </button>
            </div>

            <h3 className="chat-settings-section">Xabar ranglarini tanlang</h3>
            <div className="chat-color-grid">
              {BUBBLE_PRESETS.map((item) => {
                const selected = item.id === selectedId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`chat-color-pair${selected ? ' is-selected' : ''}`}
                    aria-pressed={selected}
                    aria-label={item.id}
                    onClick={() => choosePreset(item)}
                  >
                    <span className="chat-color-mini chat-color-mini--in" style={{ background: bubbleFill(item.incoming, mode) }} />
                    <span className="chat-color-mini chat-color-mini--out" style={{ background: bubbleFill(item.outgoing, mode) }} />
                    {selected ? (
                      <span className="chat-settings-check" aria-hidden="true">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <h3 className="chat-settings-section">Maxsus rang</h3>
            <button type="button" className="chat-color-custom" onClick={() => setShowPicker(true)}>
              <span className="chat-color-rainbow" aria-hidden="true" />
              <span className="chat-color-custom-copy">O‘zingiz xohlagan rangni tanlang</span>
              <svg className="chat-settings-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            <h3 className="chat-settings-section">Xabar namunasi</h3>
            <div className="chat-color-sample">
              <span className="chat-color-sample-in" style={inFill}>
                Bu kiruvchi xabar
                <span>20:45</span>
              </span>
              <span className="chat-color-sample-out" style={outFill}>
                Bu chiquvchi xabar
                <span>20:46</span>
              </span>
            </div>
          </div>

          <div className="chat-settings-footer">
            <button type="button" className="chat-settings-save" onClick={applyChoice}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Tanlash
            </button>
          </div>
        </div>
      </div>
      {showPicker ? (
        <ChatColorModal
          initialHex={outgoing}
          mode={mode}
          previewImage={previewImage}
          closeRef={pickerCloseRef}
          onApply={chooseCustom}
          onClose={() => setShowPicker(false)}
        />
      ) : null}
    </>
  );
};

export default ChatMessageColorModal;
