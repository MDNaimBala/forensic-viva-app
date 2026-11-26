import React, { useState, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import pharmaBoardsData from "./pharma_data.json";

function highlightText(text, query) {
  if (!query || !query.trim() || typeof text !== "string") return text;
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="search-highlight">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function highlightDirectStrings(children, query) {
  if (!query || !query.trim()) return children;
  return React.Children.map(children, (child) => {
    if (typeof child === "string") {
      return highlightText(child, query);
    }
    return child;
  });
}

function PharmacologyView() {
  const [currentBoardId, setCurrentBoardId] = useState("board_a"); // "board_a" or "board_b"
  const [currentChapterNum, setCurrentChapterNum] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [openQuestions, setOpenQuestions] = useState({});
  const [showCredits, setShowCredits] = useState(false);

  // Markdown highlight components
  const markdownComponents = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return {};
    const wrap = (Tag) => ({ node, children, ...rest }) =>
      React.createElement(Tag, rest, highlightDirectStrings(children, q));
    return {
      p: wrap("p"),
      li: wrap("li"),
      strong: wrap("strong"),
      em: wrap("em"),
      td: wrap("td"),
      th: wrap("th"),
      h1: wrap("h1"),
      h2: wrap("h2"),
      h3: wrap("h3"),
      h4: wrap("h4"),
      h5: wrap("h5"),
      h6: wrap("h6"),
      span: wrap("span"),
      blockquote: wrap("blockquote"),
    };
  }, [searchQuery]);

  // Active board
  const boardA = pharmaBoardsData.find((b) => b.id === "board_a") || pharmaBoardsData[0];
  const boardB = pharmaBoardsData.find((b) => b.id === "board_b") || pharmaBoardsData[1];
  const activeBoard = currentBoardId === "board_b" ? boardB : boardA;

  // Active chapters
  const availableChapters = activeBoard ? activeBoard.chapters : [];
  const currentChapter =
    availableChapters.find((c) => c.number === currentChapterNum) || availableChapters[0] || { topics: [] };

  // When switching board, reset chapter and search
  const handleBoardChange = (newBoardId) => {
    setCurrentBoardId(newBoardId);
    setCurrentChapterNum(1);
    setOpenQuestions({});
  };

  const handleChapterChange = (num) => {
    setCurrentChapterNum(num);
    setOpenQuestions({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "ArrowLeft") {
        if (currentChapterNum > 1) handleChapterChange(currentChapterNum - 1);
      } else if (e.key === "ArrowRight") {
        if (currentChapterNum < availableChapters.length) handleChapterChange(currentChapterNum + 1);
      } else if (e.key === "Escape") {
        setShowCredits(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentChapterNum, availableChapters.length]);

  // Filtered topics based on search
  const filteredTopics = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return currentChapter.topics || [];
    }

    const sourceTopics = currentChapter.topics || [];
    const result = [];
    sourceTopics.forEach((t) => {
      const matchedSubtopics = [];
      t.subtopics.forEach((s) => {
        const matchedQuestions = s.questions.filter((q) => {
          const qText = (q.question || "").toLowerCase();
          const ansText = (q.answer || "").toLowerCase();
          const sTitle = (s.title || "").toLowerCase();
          return qText.includes(query) || ansText.includes(query) || sTitle.includes(query);
        });
        if (matchedQuestions.length > 0) {
          matchedSubtopics.push({
            ...s,
            questions: matchedQuestions
          });
        }
      });
      if (matchedSubtopics.length > 0) {
        result.push({
          ...t,
          subtopics: matchedSubtopics
        });
      }
    });
    return result;
  }, [searchQuery, currentChapter]);

  // Question expand/collapse
  const isSearching = !!searchQuery.trim();

  const toggleQuestion = (id) => {
    setOpenQuestions((prev) => {
      const current = isSearching ? prev[id] !== false : !!prev[id];
      return {
        ...prev,
        [id]: !current
      };
    });
  };

  const totalFilteredCount = useMemo(() => {
    if (!searchQuery.trim()) {
      return currentChapter.total_questions || 0;
    }
    return filteredTopics.reduce(
      (acc, t) => acc + t.subtopics.reduce((sAcc, s) => sAcc + s.questions.length, 0),
      0
    );
  }, [searchQuery, currentChapter, filteredTopics]);

  const handleExpandAll = () => {
    const allOpen = {};
    filteredTopics.forEach((t) => {
      t.subtopics.forEach((s) => {
        s.questions.forEach((q) => {
          allOpen[q.id] = true;
        });
      });
    });
    setOpenQuestions(allOpen);
  };

  const handleCollapseAll = () => {
    const allClosed = {};
    filteredTopics.forEach((t) => {
      t.subtopics.forEach((s) => {
        s.questions.forEach((q) => {
          allClosed[q.id] = false;
        });
      });
    });
    setOpenQuestions(allClosed);
  };

  const allAreOpen =
    totalFilteredCount > 0 &&
    filteredTopics.every((t) =>
      t.subtopics.every((s) =>
        s.questions.every((q) => (isSearching ? openQuestions[q.id] !== false : !!openQuestions[q.id]))
      )
    );

  return (
    <div className="card-container">
      <div className="card-sheet">
        {/* Board Switcher (Strictly Board A and Board B) */}
        <div className="board-switcher">
          <button
            className={`board-btn ${currentBoardId === "board_a" ? "active" : ""}`}
            onClick={() => handleBoardChange("board_a")}
          >
            Board A
          </button>
          <button
            className={`board-btn ${currentBoardId === "board_b" ? "active" : ""}`}
            onClick={() => handleBoardChange("board_b")}
          >
            Board B
          </button>
        </div>

        {/* AI Disclaimer Dropdown */}
        <details className="disclaimer-details">
          <summary className="disclaimer-summary">
            <span className="disclaimer-summary-title">
              <span className="disclaimer-arrow">▸</span> Disclaimer
            </span>
          </summary>
          <div className="disclaimer-body">
            Answers were compiled from the Blueprint Pharmacology Guide using NotebookLM. Since they were generated with AI assistance, they are mistake-prone and may contain inaccuracies—please verify against standard textbooks.
          </div>
        </details>

        {/* Chapter Navigation Chips & Dropdown */}
        <div className="chapter-nav-section">
          <div className="chapter-chips-row">
            <span className="chips-label">Chapters:</span>
            <div className="chips-list">
              {availableChapters.map((ch) => (
                <button
                  key={ch.id}
                  className={`chip-btn ${currentChapterNum === ch.number ? "active" : ""}`}
                  onClick={() => handleChapterChange(ch.number)}
                >
                  {String(ch.number).padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>

          <div className="chapter-selector-row">
            <button
              className="nav-arrow-btn"
              onClick={() => handleChapterChange(currentChapterNum - 1)}
              disabled={currentChapterNum <= 1}
              title="Previous Chapter"
            >
              &larr; Prev
            </button>

            <select
              className="chapter-dropdown"
              value={currentChapterNum}
              onChange={(e) => handleChapterChange(Number(e.target.value))}
            >
              {availableChapters.map((ch) => (
                <option key={ch.id} value={ch.number}>
                  {ch.title} ({ch.total_questions} Questions)
                </option>
              ))}
            </select>

            <button
              className="nav-arrow-btn"
              onClick={() => handleChapterChange(currentChapterNum + 1)}
              disabled={currentChapterNum >= availableChapters.length}
              title="Next Chapter"
            >
              Next &rarr;
            </button>
          </div>
        </div>

        {/* Action Bar & Search */}
        <div className="action-bar">
          <div className="active-title-block">
            <h2 className="current-chapter-title">
              {currentChapter.title}
            </h2>
          </div>

          <div className="search-controls">
            <input
              type="text"
              className="search-input"
              placeholder="Search question"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery("")}>
                &times;
              </button>
            )}

            <button
              className="expand-toggle-btn"
              onClick={allAreOpen ? handleCollapseAll : handleExpandAll}
            >
              {allAreOpen ? "Collapse All" : "Expand All"}
            </button>
          </div>
        </div>

        {/* Hierarchical Questions Display */}
        <div className="questions-container">
          {filteredTopics.length === 0 ? (
            <div className="no-results">
              <p>No questions matched your search query <strong>"{searchQuery}"</strong>.</p>
              <button className="reset-btn" onClick={() => setSearchQuery("")}>
                Clear Search
              </button>
            </div>
          ) : (
            filteredTopics.map((topic, tIdx) => (
              <div key={tIdx} className="major-topic-section">
                {/* Major Topic Banner */}
                <div className="major-topic-banner">
                  <span className="major-topic-title">{topic.title}</span>
                </div>

                {/* Subtopic Groups */}
                <div className="subtopics-list">
                  {topic.subtopics.map((sub, sIdx) => (
                    <div key={sIdx} className="subtopic-block">
                      <div className="subtopic-header-bar">
                        <span className="subtopic-heading-text">
                          {highlightText(sub.title, searchQuery)}
                        </span>
                        <span className="subtopic-count-pill">
                          {sub.questions.length} {sub.questions.length === 1 ? "Question" : "Questions"}
                        </span>
                      </div>

                      <div className="subtopic-questions">
                        {sub.questions.map((q) => {
                          const isOpen = isSearching ? openQuestions[q.id] !== false : !!openQuestions[q.id];
                          return (
                            <div
                              key={q.id}
                              className={`question-card ${isOpen ? "expanded" : ""}`}
                            >
                              <div
                                className="question-card-header"
                                onClick={() => toggleQuestion(q.id)}
                              >
                                <div className="q-left">
                                  <span className="q-index-badge">
                                    {String(q.chapter_index || q.global_index).padStart(2, "0")}.
                                  </span>
                                  <div className="q-text-content">
                                    <span className="q-title-text">
                                      {highlightText(q.question, searchQuery)}
                                    </span>
                                  </div>
                                </div>

                                <div className="q-right">
                                  <span className={`chevron-icon ${isOpen ? "open" : ""}`}>
                                    &#9662;
                                  </span>
                                </div>
                              </div>

                              {isOpen && (
                                <div className="answer-drawer">
                                  <div className="answer-divider"></div>
                                  <div className="markdown-answer-body">
                                    <ReactMarkdown
                                      remarkPlugins={[remarkGfm]}
                                      components={markdownComponents}
                                    >
                                      {q.answer || "*No detailed solution provided.*"}
                                    </ReactMarkdown>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Discreet Question Mark Button for Attribution */}
      <div className="credits-bottom-bar">
        <button
          className="credits-trigger-btn"
          onClick={() => setShowCredits(true)}
          title="About Authorship & Solutions"
          aria-label="About Authorship"
        >
          ?
        </button>
      </div>

      {/* Attribution Modal */}
      {showCredits && (
        <div className="credits-overlay" onClick={() => setShowCredits(false)}>
          <div className="credits-modal" onClick={(e) => e.stopPropagation()}>
            <div className="credits-content">
              <p className="credit-line">
                by{" "}
                <a
                  href="https://mohammad-naimb.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="author-link"
                >
                  Mohammad Naim
                </a>
              </p>
              <p className="credit-line secondary">
                using Google NotebookLM &amp; Blueprint Guide
              </p>
            </div>
            <button
              className="credits-close-btn"
              onClick={() => setShowCredits(false)}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PharmacologyView;
