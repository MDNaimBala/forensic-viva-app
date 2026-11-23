import React, { useState, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import allSetsData from "./all_sets.json";
import rawTopicsData from "./raw_questions.json";
import "./App.css";

const setKeys = Object.keys(allSetsData).sort();

function App() {
  const [currentSet, setCurrentSet] = useState("01"); // "01", "02", or "raw"
  const [currentCardKey, setCurrentCardKey] = useState("01");
  const [currentTopicIdx, setCurrentTopicIdx] = useState(0);
  const [openQuestions, setOpenQuestions] = useState({});

  // Mode helpers
  const isRawMode = currentSet === "raw";

  // Set 1 & 2 data
  const currentSetCards = allSetsData[currentSet] || allSetsData["01"];
  const cardKeys = Object.keys(currentSetCards).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  const cardData = currentSetCards[currentCardKey] || currentSetCards["01"];

  // Raw data
  const currentTopic = rawTopicsData[currentTopicIdx] || rawTopicsData[0];

  // Group raw questions by broad source (54 Batch vs Photo Solution)
  const groupedRawQuestions = useMemo(() => {
    if (!isRawMode || !currentTopic) return [];
    const groups = [];
    let currentGroup = null;
    currentTopic.questions.forEach((q) => {
      const groupTitle =
        q.source === "Photo Solution"
          ? "Teachers Questions"
          : "54 Batch Viva Questions";
      if (!currentGroup || currentGroup.source !== q.source) {
        currentGroup = {
          source: q.source,
          title: groupTitle,
          questions: []
        };
        groups.push(currentGroup);
      }
      currentGroup.questions.push(q);
    });
    return groups;
  }, [isRawMode, currentTopic]);

  const handleSetChange = (newSet) => {
    setCurrentSet(newSet);
    if (newSet !== "raw") {
      setCurrentCardKey("01");
    } else {
      setCurrentTopicIdx(0);
    }
    setOpenQuestions({});
  };

  const handleCardChange = (newKey) => {
    setCurrentCardKey(newKey);
    setOpenQuestions({});
  };

  const handleTopicChange = (newIdx) => {
    setCurrentTopicIdx(newIdx);
    setOpenQuestions({});
  };

  // Navigation handlers
  const currentIdx = cardKeys.indexOf(currentCardKey);
  const handlePrev = () => {
    if (isRawMode) {
      if (currentTopicIdx > 0) handleTopicChange(currentTopicIdx - 1);
    } else {
      if (currentIdx > 0) handleCardChange(cardKeys[currentIdx - 1]);
    }
  };

  const handleNext = () => {
    if (isRawMode) {
      if (currentTopicIdx < rawTopicsData.length - 1) handleTopicChange(currentTopicIdx + 1);
    } else {
      if (currentIdx < cardKeys.length - 1) handleCardChange(cardKeys[currentIdx + 1]);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        if (isRawMode) {
          if (currentTopicIdx > 0) handleTopicChange(currentTopicIdx - 1);
        } else {
          if (currentIdx > 0) handleCardChange(cardKeys[currentIdx - 1]);
        }
      } else if (e.key === "ArrowRight") {
        if (isRawMode) {
          if (currentTopicIdx < rawTopicsData.length - 1) handleTopicChange(currentTopicIdx + 1);
        } else {
          if (currentIdx < cardKeys.length - 1) handleCardChange(cardKeys[currentIdx + 1]);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRawMode, currentIdx, currentTopicIdx]);

  const toggleQuestion = (qId) => {
    setOpenQuestions((prev) => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  // Expand / collapse all logic
  const allCurrentQIds = isRawMode
    ? currentTopic.questions.map((q) => q.id)
    : cardData.categories.flatMap((c) => c.questions.map((q) => q.no));

  const allExpanded = allCurrentQIds.length > 0 && allCurrentQIds.every((id) => openQuestions[id]);

  const toggleExpandAll = () => {
    if (allExpanded) {
      setOpenQuestions({});
    } else {
      const nextOpen = {};
      allCurrentQIds.forEach((id) => {
        nextOpen[id] = true;
      });
      setOpenQuestions(nextOpen);
    }
  };

  return (
    <div className="page-container">
      {/* Top Controller Bar */}
      <div className="exam-controller">
        {/* Row 1: Mode switcher, nav buttons, indicator, expand all */}
        <div className="controller-row main-controls">
          <div className="set-switcher-bar">
            {setKeys.map((sKey) => {
              const isActive = currentSet === sKey;
              return (
                <button
                  key={sKey}
                  className={`set-btn ${isActive ? "active" : ""}`}
                  onClick={() => handleSetChange(sKey)}
                >
                  Set {sKey}
                </button>
              );
            })}
            <button
              className={`set-btn raw-btn ${isRawMode ? "active" : ""}`}
              onClick={() => handleSetChange("raw")}
              title="Raw Viva Questions (54 Batch & Teacher Viva Solutions)"
            >
              Raw Questions
            </button>
          </div>

          <div className="nav-buttons">
            <button
              className="ctrl-btn"
              onClick={handlePrev}
              disabled={isRawMode ? currentTopicIdx === 0 : currentIdx === 0}
              title={isRawMode ? "Previous Topic (Left Arrow)" : "Previous Card (Left Arrow)"}
            >
              &larr; Prev
            </button>
            <button
              className="ctrl-btn"
              onClick={handleNext}
              disabled={isRawMode ? currentTopicIdx === rawTopicsData.length - 1 : currentIdx === cardKeys.length - 1}
              title={isRawMode ? "Next Topic (Right Arrow)" : "Next Card (Right Arrow)"}
            >
              Next &rarr;
            </button>
          </div>

          <div className="card-indicator">
            {isRawMode ? (
              <span>Topic {currentTopicIdx + 1} / {rawTopicsData.length}</span>
            ) : (
              <span>Card {currentCardKey} / 25</span>
            )}
          </div>

          <button
            className="ctrl-btn expand-all-btn"
            onClick={toggleExpandAll}
            title="Expand or collapse all answers"
          >
            {allExpanded ? "Collapse All" : "Expand All"}
          </button>
        </div>

        {/* Row 2: Card / Topic Selector Pills */}
        <div className="card-selector-bar">
          {isRawMode ? (
            <div className="raw-topic-selector">
              <div className="selector-header">
                <span className="selector-label">Topic:</span>
                <select
                  className="topic-dropdown"
                  value={currentTopicIdx}
                  onChange={(e) => handleTopicChange(parseInt(e.target.value, 10))}
                >
                  {rawTopicsData.map((t, idx) => (
                    <option key={t.id} value={idx}>
                      {idx + 1}. {t.title} ({t.question_count} Qs)
                    </option>
                  ))}
                </select>
              </div>

              <div className="pill-grid">
                {rawTopicsData.map((t, idx) => {
                  const isActive = idx === currentTopicIdx;
                  return (
                    <button
                      key={t.id}
                      className={`card-pill topic-pill ${isActive ? "active" : ""}`}
                      onClick={() => handleTopicChange(idx)}
                      title={`${idx + 1}. ${t.title} (${t.question_count} Qs)`}
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              <span className="selector-label">Card:</span>
              <div className="pill-grid">
                {cardKeys.map((key) => {
                  const isActive = key === currentCardKey;
                  return (
                    <button
                      key={key}
                      className={`card-pill ${isActive ? "active" : ""}`}
                      onClick={() => handleCardChange(key)}
                    >
                      {key}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Sheet Container */}
      <div className="card-sheet">
        {isRawMode ? (
          /* ==================== RAW QUESTIONS VIEW ==================== */
          <div>
            <div className="sheet-header">
              <div className="set-title">Raw Viva Questions</div>
            </div>

            <div className="card-subhead raw-subhead">
              <div className="topic-main-title">
                {currentTopicIdx + 1}. {currentTopic.title}
              </div>
              <div className="topic-meta">
                <span className="meta-badge">{currentTopic.question_count} Questions</span>
              </div>
            </div>

            {/* DESKTOP VIEW: Raw Questions Table */}
            <div className="desktop-view">
              <table className="soe-table raw-table">
                <thead>
                  <tr>
                    <th className="th-no">Que.<br />no</th>
                    <th className="th-source">Contributor / Examiner</th>
                    <th className="th-question">Question</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedRawQuestions.map((group) => (
                    <React.Fragment key={group.title}>
                      {/* Broad Category Divider Row */}
                      <tr className="raw-cat-row">
                        <td colSpan={3} className="raw-cat-cell">
                          <span className="raw-cat-title">{group.title}</span>
                        </td>
                      </tr>

                      {group.questions.map((q) => {
                        const isOpen = !!openQuestions[q.id];
                        return (
                          <React.Fragment key={q.id}>
                            <tr
                              className={`q-row ${isOpen ? "active-row" : ""}`}
                              onClick={() => toggleQuestion(q.id)}
                              title="Click to toggle answer"
                            >
                              <td className="td-no">{q.q_num}</td>
                              <td className="td-source">
                                <span className="contributor-name">
                                  {q.credit || "—"}
                                </span>
                              </td>
                              <td className="td-question">
                                <div className="question-content">
                                  <span className="question-text">{q.question}</span>
                                  <span className={`toggle-icon ${isOpen ? "expanded" : ""}`}>
                                    {isOpen ? "▲" : "▼"}
                                  </span>
                                </div>
                              </td>
                            </tr>

                            {isOpen && (
                              <tr className="dropdown-row">
                                <td className="td-no-blank" colSpan={2}></td>
                                <td className="td-answer">
                                  <div className="answer-box">
                                    <div className="answer-header">Answer:</div>
                                    <div className="markdown-body">
                                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {q.answer}
                                      </ReactMarkdown>
                                    </div>
                                    {q.page_ref && (
                                      <div className="page-ref-box">
                                        <span className="page-ref-label">Page Reference:</span> {q.page_ref}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE VIEW: Minimalist 2-Column Table */}
            <div className="mobile-view">
              <table className="mobile-exam-table">
                <thead>
                  <tr>
                    <th className="m-th-no">Que.</th>
                    <th className="m-th-question">Question</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedRawQuestions.map((group) => (
                    <React.Fragment key={group.title}>
                      {/* Broad Category Divider Row */}
                      <tr className="mobile-cat-row">
                        <td colSpan={2} className="mobile-cat-cell">
                          <span className="mobile-cat-title">{group.title}</span>
                        </td>
                      </tr>

                      {group.questions.map((q) => {
                        const isOpen = !!openQuestions[q.id];
                        return (
                          <React.Fragment key={q.id}>
                            <tr
                              className={`mobile-q-row ${isOpen ? "active-q" : ""}`}
                              onClick={() => toggleQuestion(q.id)}
                            >
                              <td className="mobile-q-no">{q.q_num}</td>
                              <td className="mobile-q-cell">
                                <div className="mobile-q-wrap">
                                  <div className="mobile-q-main">
                                    <span className="mobile-q-text">{q.question}</span>
                                    {q.credit && (
                                      <div className="m-contributor">
                                        — {q.credit}
                                      </div>
                                    )}
                                  </div>
                                  <span className="mobile-toggle-indicator">
                                    {isOpen ? "▲" : "▼"}
                                  </span>
                                </div>
                              </td>
                            </tr>

                            {isOpen && (
                              <tr className="mobile-ans-row">
                                <td colSpan={2} className="mobile-ans-cell">
                                  <div className="answer-box">
                                    <div className="answer-header">Answer:</div>
                                    <div className="markdown-body">
                                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {q.answer}
                                      </ReactMarkdown>
                                    </div>
                                    {q.page_ref && (
                                      <div className="page-ref-box">
                                        <span className="page-ref-label">Page Reference:</span> {q.page_ref}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ==================== SET 01 & 02 EXAM CARD VIEW ==================== */
          <div>
            <div className="sheet-header">
              <div className="set-title">Set – {cardData.setNumber}</div>
            </div>

            <div className="card-subhead">
              <span>SOE Card no: {cardData.cardNumber}</span>
            </div>

            {/* DESKTOP VIEW: Exact 3-Column Paper Table */}
            <div className="desktop-view">
              <table className="soe-table">
                <thead>
                  <tr>
                    <th className="th-type">Type of Question</th>
                    <th className="th-no">Que.<br />no</th>
                    <th className="th-question">Question</th>
                  </tr>
                </thead>
                <tbody>
                  {cardData.categories.map((category) => {
                    const catRowSpan = category.questions.reduce(
                      (acc, q) => acc + (openQuestions[q.no] ? 2 : 1),
                      0
                    );

                    return (
                      <React.Fragment key={category.name}>
                        {category.questions.map((q, idx) => {
                          const isOpen = !!openQuestions[q.no];
                          return (
                            <React.Fragment key={q.no}>
                              <tr
                                className={`q-row ${isOpen ? "active-row" : ""}`}
                                onClick={() => toggleQuestion(q.no)}
                                title="Click to toggle answer"
                              >
                                {idx === 0 && (
                                  <td className="td-type" rowSpan={catRowSpan}>
                                    <span className="type-label">{category.name}</span>
                                  </td>
                                )}
                                <td className="td-no">{q.no}</td>
                                <td className="td-question">
                                  <div className="question-content">
                                    <span className="question-text">{q.text}</span>
                                    <span className={`toggle-icon ${isOpen ? "expanded" : ""}`}>
                                      {isOpen ? "▲" : "▼"}
                                    </span>
                                  </div>
                                </td>
                              </tr>

                              {isOpen && (
                                <tr className="dropdown-row">
                                  <td className="td-no-blank"></td>
                                  <td className="td-answer">
                                    <div className="answer-box">
                                      <div className="answer-header">Answer:</div>
                                      <div className="markdown-body">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                          {q.answerMarkdown}
                                        </ReactMarkdown>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE VIEW: Minimalist Examination Table */}
            <div className="mobile-view">
              <table className="mobile-exam-table">
                <thead>
                  <tr>
                    <th className="m-th-no">Que.</th>
                    <th className="m-th-question">Question</th>
                  </tr>
                </thead>
                <tbody>
                  {cardData.categories.map((category) => (
                    <React.Fragment key={category.name}>
                      <tr className="mobile-cat-row">
                        <td colSpan={2} className="mobile-cat-cell">
                          <span className="mobile-cat-title">{category.name}</span>
                        </td>
                      </tr>

                      {category.questions.map((q) => {
                        const isOpen = !!openQuestions[q.no];
                        return (
                          <React.Fragment key={q.no}>
                            <tr
                              className={`mobile-q-row ${isOpen ? "active-q" : ""}`}
                              onClick={() => toggleQuestion(q.no)}
                            >
                              <td className="mobile-q-no">{q.no}</td>
                              <td className="mobile-q-cell">
                                <div className="mobile-q-wrap">
                                  <span className="mobile-q-text">{q.text}</span>
                                  <span className="mobile-toggle-indicator">
                                    {isOpen ? "▲" : "▼"}
                                  </span>
                                </div>
                              </td>
                            </tr>

                            {isOpen && (
                              <tr className="mobile-ans-row">
                                <td colSpan={2} className="mobile-ans-cell">
                                  <div className="answer-box">
                                    <div className="answer-header">Answer:</div>
                                    <div className="markdown-body">
                                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {q.answerMarkdown}
                                      </ReactMarkdown>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
