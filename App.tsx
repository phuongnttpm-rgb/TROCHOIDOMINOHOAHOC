import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  FileJson,
  Upload,
  Layers,
  HelpCircle,
  CheckCircle,
  XCircle,
  Tv,
  Eye,
  EyeOff,
  Compass,
  ArrowRight,
  BookmarkCheck,
  UserCheck,
  ChevronRight,
  Info,
  Atom,
  FlaskConical,
  Flame,
  BookOpen
} from "lucide-react";
import { GRADE_TEMPLATES, PRESET_IMAGES } from "./data";
import { DominoCard, QuestionAnswer } from "./types";

const renderTopicIcon = (iconName: string, className: string) => {
  switch (iconName) {
    case "Atom":
      return <Atom className={className} />;
    case "Layers":
      return <Layers className={className} />;
    case "Sparkles":
      return <Sparkles className={className} />;
    case "Zap":
      return <Flame className={className} />;
    case "Compass":
      return <Compass className={className} />;
    default:
      return <FlaskConical className={className} />;
  }
};

export default function App() {
  // Game Configuration & Setup States
  const [grade, setGrade] = useState<number>(11);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("11_organic_intro");
  const [maxQuestions, setMaxQuestions] = useState<number>(20);
  const [jsonInput, setJsonInput] = useState<string>("");
  const [bgImageUrl, setBgImageUrl] = useState<string>(PRESET_IMAGES[0].url);
  const [customImageName, setCustomImageName] = useState<string>("");

  // Core Game State
  const [deckCards, setDeckCards] = useState<DominoCard[]>([]);
  const [chainCards, setChainCards] = useState<DominoCard[]>([]);
  const [isGameActive, setIsGameActive] = useState<boolean>(false);
  const [victory, setVictory] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [showImageOnCards, setShowImageOnCards] = useState<boolean>(true);
  const [autoShuffle, setAutoShuffle] = useState<boolean>(true);

  // Interaction feedback states
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [isOverDropzone, setIsOverDropzone] = useState<boolean>(false);
  const [wrongCardId, setWrongCardId] = useState<string | null>(null);
  const [correctCardId, setCorrectCardId] = useState<string | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Ref for scrolling the chain
  const chainEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize with Grade 11, Topic: Organic Intro on first load
  useEffect(() => {
    const defaultGradeTemplate = GRADE_TEMPLATES.find(t => t.grade === 11) || GRADE_TEMPLATES[0];
    const defaultTopic = defaultGradeTemplate.topics.find(t => t.id === "11_organic_intro") || defaultGradeTemplate.topics[0];
    if (defaultTopic) {
      setSelectedTopicId(defaultTopic.id);
      setJsonInput(JSON.stringify(defaultTopic.data, null, 2));
      setMaxQuestions(Math.min(20, defaultTopic.data.length));
    }
  }, []);

  // Update JSON template when grade changes
  const handleGradeChange = (selectedGrade: number) => {
    setGrade(selectedGrade);
    const gradeTemplate = GRADE_TEMPLATES.find(t => t.grade === selectedGrade);
    if (gradeTemplate && gradeTemplate.topics.length > 0) {
      const defaultTopic = gradeTemplate.topics[0];
      setSelectedTopicId(defaultTopic.id);
      setJsonInput(JSON.stringify(defaultTopic.data, null, 2));
      setMaxQuestions(Math.min(20, defaultTopic.data.length));
      setJsonError(null);
    }
  };

  // Update JSON template when topic changes
  const handleTopicChange = (topicId: string) => {
    setSelectedTopicId(topicId);
    const gradeTemplate = GRADE_TEMPLATES.find(t => t.grade === grade);
    if (gradeTemplate) {
      const topic = gradeTemplate.topics.find(t => t.id === topicId);
      if (topic) {
        setJsonInput(JSON.stringify(topic.data, null, 2));
        setMaxQuestions(Math.min(20, topic.data.length));
        setJsonError(null);
        speakVoice(`Đã chuyển sang chủ đề: ${topic.title}`);
      }
    }
  };

  const handleFormatJson = () => {
    try {
      setJsonError(null);
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed, null, 2));
      speakVoice("Đã định dạng dữ liệu câu hỏi!");
    } catch (e: any) {
      setJsonError("Không thể định dạng. JSON không đúng cấu trúc: " + e.message);
      playSound("failure");
    }
  };

  const handleRestoreTemplate = () => {
    const gradeTemplate = GRADE_TEMPLATES.find(t => t.grade === grade);
    if (gradeTemplate) {
      const topic = gradeTemplate.topics.find(t => t.id === selectedTopicId) || gradeTemplate.topics[0];
      if (topic) {
        setJsonInput(JSON.stringify(topic.data, null, 2));
        setMaxQuestions(Math.min(20, topic.data.length));
        setJsonError(null);
        speakVoice("Đã khôi phục câu hỏi mẫu!");
      }
    }
  };

  // Safe MathJax Trigger
  const triggerMathJax = () => {
    setTimeout(() => {
      const windowObj = window as any;
      if (windowObj.MathJax && typeof windowObj.MathJax.typesetPromise === "function") {
        windowObj.MathJax.typesetPromise()
          .catch((err: any) => console.log("MathJax typesetting failed:", err));
      }
    }, 120);
  };

  // Synthesize sound effects using Web Audio API (zero static asset requirements!)
  const playSound = (type: "success" | "failure" | "victory") => {
    if (isMuted) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      if (type === "success") {
        // Double tone beep: high pitch "Ting!"
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.08); // G5
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === "failure") {
        // Harsh low buzz "Bzzzt"
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(146.83, ctx.currentTime); // D3
        osc.frequency.linearRampToValueAtTime(110.00, ctx.currentTime + 0.22); // A2
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === "victory") {
        // Complete glorious upward arpeggio
        const chord = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major scale arpeggio
        chord.forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.08);
          gain.gain.setValueAtTime(0.08, ctx.currentTime + index * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.08 + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + index * 0.08);
          osc.stop(ctx.currentTime + index * 0.08 + 0.6);
        });
      }
    } catch (e) {
      console.warn("Audio Context initialization failed or browser blocked sound:", e);
    }
  };

  // Speech Synthesis for Vietnamese guidelines & reactions
  const speakVoice = (text: string) => {
    if (isMuted || !voiceEnabled) return;
    try {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "vi-VN";
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn("Speech Synthesis failed:", e);
    }
  };

  // Parse questions from JSON text and start the game
  const handleStartGame = () => {
    try {
      setJsonError(null);
      const parsed: QuestionAnswer[] = JSON.parse(jsonInput);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("Dữ liệu JSON phải là một mảng chứa ít nhất 1 câu hỏi.");
      }

      // Check format
      parsed.forEach((item, index) => {
        if (!item.question || !item.answer) {
          throw new Error(`Mục thứ ${index + 1} thiếu thuộc tính "question" hoặc "answer".`);
        }
      });

      // Clamp questions to a maximum of 20
      const numQuestions = Math.min(20, Math.min(parsed.length, Math.max(1, maxQuestions)));
      const activeQuestions = parsed.slice(0, numQuestions);
      const N = activeQuestions.length; // Number of questions, means N+1 cards

      // Create Cards
      // Card 0: [ START | Q1 ]
      // Card i: [ Ans(i) | Q(i+1) ]
      // Card N: [ Ans(N) | END ]
      const generatedCards: DominoCard[] = [];

      for (let i = 0; i <= N; i++) {
        let answerText = "";
        let questionText = "";
        let isStart = false;
        let isEnd = false;

        if (i === 0) {
          answerText = "BẮT ĐẦU";
          questionText = activeQuestions[0].question;
          isStart = true;
        } else if (i === N) {
          answerText = activeQuestions[N - 1].answer;
          questionText = "KẾT THÚC";
          isEnd = true;
        } else {
          answerText = activeQuestions[i - 1].answer;
          questionText = activeQuestions[i].question;
        }

        // Calculate horizontal slice positions for image
        const bgPositionX = N > 0 ? `${(i / N) * 100}%` : "0%";
        const bgWidth = `${(N + 1) * 100}%`;

        generatedCards.push({
          id: `domino-card-${i}`,
          index: i,
          answer: answerText,
          question: questionText,
          isStart,
          isEnd,
          bgPositionX,
          bgPositionY: "50%",
          bgWidth,
          bgHeight: "100%"
        });
      }

      // Card 0 goes directly to the chain (always unlocked and revealed first)
      const startCard = generatedCards[0];

      // Shuffle other cards (1 to N)
      const cardsToShuffle = generatedCards.slice(1);
      const shuffled = [...cardsToShuffle];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      setChainCards([startCard]);
      setDeckCards(shuffled);
      setIsGameActive(true);
      setVictory(false);
      setWrongCardId(null);
      setCorrectCardId(null);

      // Speak and update
      speakVoice("Bắt đầu trò chơi xếp thẻ Domino! Hãy tìm đáp án chính xác.");
      triggerMathJax();
    } catch (e: any) {
      setJsonError(e.message || "Định dạng JSON không hợp lệ. Vui lòng kiểm tra lại dấu ngoặc và phẩy.");
    }
  };

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    setDraggedCardId(cardId);
    e.dataTransfer.setData("text/plain", cardId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedCardId(null);
    setIsOverDropzone(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOverDropzone(true);
  };

  const handleDragLeave = () => {
    setIsOverDropzone(false);
  };

  const handleDropOnZone = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOverDropzone(false);

    const cardId = e.dataTransfer.getData("text/plain") || draggedCardId;
    if (!cardId) return;

    // Find card in deck
    const card = deckCards.find(c => c.id === cardId);
    if (!card) return;

    // Validate if this card fits next in sequence
    // The expected next card index is equal to the current chain length
    const expectedIndex = chainCards.length;

    if (card.index === expectedIndex) {
      // Success!
      setChainCards(prev => [...prev, card]);
      setDeckCards(prev => {
        const remaining = prev.filter(c => c.id !== cardId);
        if (autoShuffle && remaining.length > 1) {
          const shuffled = [...remaining];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          return shuffled;
        }
        return remaining;
      });
      setCorrectCardId(cardId);
      playSound("success");

      // Give spoken reaction
      const reactions = ["Chính xác", "Tuyệt vời", "Rất tốt", "Hoàn hảo", "Chuẩn xác"];
      const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
      speakVoice(randomReaction);

      // Check if game complete
      // If we just added card N, the deck becomes empty
      if (deckCards.length === 1) {
        setVictory(true);
        playSound("victory");
        speakVoice("Chúc mừng cả lớp đã hoàn thành dải domino và giải mã được thông điệp ẩn giấu!");
      }

      setTimeout(() => {
        setCorrectCardId(null);
      }, 1000);

      // Auto scroll to rightmost card
      setTimeout(() => {
        chainEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "end" });
      }, 100);
    } else {
      // Incorrect match!
      setWrongCardId(cardId);
      playSound("failure");
      speakVoice("Chưa đúng rồi, hãy thử lại");

      setTimeout(() => {
        setWrongCardId(null);
      }, 1200);
    }
  };

  // Auto solve one card (helps for classroom presentation/cheat)
  const handleAutoSolveOne = () => {
    if (!isGameActive || victory || deckCards.length === 0) return;

    const expectedIndex = chainCards.length;
    const correctCard = deckCards.find(c => c.index === expectedIndex);

    if (correctCard) {
      setChainCards(prev => [...prev, correctCard]);
      setDeckCards(prev => {
        const remaining = prev.filter(c => c.id !== correctCard.id);
        if (autoShuffle && remaining.length > 1) {
          const shuffled = [...remaining];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          return shuffled;
        }
        return remaining;
      });
      playSound("success");
      speakVoice("Tự động nối tiếp một thẻ!");

      if (deckCards.length === 1) {
        setVictory(true);
        playSound("victory");
        speakVoice("Hoàn thành trò chơi!");
      }

      setTimeout(() => {
        chainEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "end" });
      }, 100);
    }
  };

  // Manual shuffle of waiting pool cards
  const handleManualShuffle = () => {
    if (deckCards.length <= 1) return;
    const shuffled = [...deckCards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setDeckCards(shuffled);
    speakVoice("Đã đảo vị trí các thẻ chờ!");
    playSound("success");
    triggerMathJax();
  };

  // Reset current game
  const handleResetGame = () => {
    setIsGameActive(false);
    setVictory(false);
    setChainCards([]);
    setDeckCards([]);
    setJsonError(null);
  };

  // Handle image upload from computer
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCustomImageName(file.name);
      const url = URL.createObjectURL(file);
      setBgImageUrl(url);
      speakVoice("Đã tải ảnh thông điệp của bạn lên thành công!");
    }
  };

  // Quick preset image selector
  const selectPresetImage = (url: string, name: string) => {
    setBgImageUrl(url);
    setCustomImageName("");
    speakVoice(`Đã đổi ảnh nền: ${name}`);
  };

  // Trigger MathJax rendering when game state changes
  useEffect(() => {
    if (isGameActive) {
      triggerMathJax();
    }
  }, [chainCards, deckCards, isGameActive]);

  // Current Hint target (Vế phải của thẻ cuối cùng)
  const lastCardInChain = chainCards.length > 0 ? chainCards[chainCards.length - 1] : null;
  const currentTargetQuestionText = lastCardInChain ? lastCardInChain.question : "";

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F7F4EB] text-[#2C2520] font-sans antialiased p-3 select-none">
      
      {/* HEADER BAR */}
      <header className="flex items-center justify-between bg-[#FCFAF5] border border-amber-900/10 rounded-xl px-4 py-2.5 shadow-sm mb-2.5">
        <div className="flex items-center gap-3">
          <div className="p-0.5 bg-sky-100 rounded-full border border-amber-950/20 overflow-hidden flex items-center justify-center shadow-md">
            <svg viewBox="0 0 100 100" className="w-12 h-12 select-none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                {/* Background Sky & Hills */}
                <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#7DD3FC" />
                  <stop offset="100%" stopColor="#BAE6FD" />
                </linearGradient>
                <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFF2E7" />
                  <stop offset="100%" stopColor="#FCD5BE" />
                </linearGradient>
                <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2A2421" />
                  <stop offset="100%" stopColor="#110C0A" />
                </linearGradient>
                <linearGradient id="hatGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#F5ECD7" />
                  <stop offset="100%" stopColor="#E2D4B6" />
                </linearGradient>
              </defs>
              
              {/* Circular Background with Landscape (Sky and Green Hills) */}
              <circle cx="50" cy="50" r="48" fill="url(#skyGrad)" stroke="#F59E0B" strokeWidth="1.5" />
              
              {/* White Clouds */}
              <circle cx="28" cy="22" r="8" fill="#FFFFFF" opacity="0.85" />
              <circle cx="36" cy="24" r="6" fill="#FFFFFF" opacity="0.85" />
              <circle cx="75" cy="26" r="7" fill="#FFFFFF" opacity="0.8" />
              <circle cx="82" cy="28" r="5" fill="#FFFFFF" opacity="0.8" />

              {/* Green Hills from the Photo */}
              <path d="M2,75 Q20,55 50,70 T98,65 L98,98 L2,98 Z" fill="#15803D" />
              <path d="M2,82 Q35,68 70,82 T98,78 L98,98 L2,98 Z" fill="#166534" opacity="0.8" />

              {/* Blue Polo Shirt with Collar & Emblem */}
              <path d="M22,88 C22,78 32,72 50,72 C68,72 78,78 78,88 L78,100 L22,100 Z" fill="#0284C7" stroke="#0369A1" strokeWidth="1" />
              
              {/* Polo Shirt Collar */}
              <path d="M36,72 L50,84 L45,84 Z" fill="#0369A1" />
              <path d="M64,72 L50,84 L55,84 Z" fill="#0369A1" />
              <path d="M38,72 L50,82 L62,72 Z" fill="#0284C7" />
              {/* Golden Yellow Emblem on Left Chest */}
              <circle cx="38" cy="80" r="2.5" fill="#EAB308" />
              <circle cx="38" cy="80" r="1.5" fill="#3B82F6" />
              
              {/* Neck */}
              <path d="M44,56 L44,73 C44,73 47,75 50,75 C53,75 56,73 56,73 L56,56 Z" fill="url(#skinGrad)" />
              
              {/* Face */}
              <path d="M36,44 C36,32 42,28 50,28 C58,28 64,32 64,44 C64,55 58,59 50,59 C42,59 36,55 36,44 Z" fill="url(#skinGrad)" />

              {/* Cheeks blush */}
              <circle cx="41" cy="48" r="3.5" fill="#F43F5E" opacity="0.2" />
              <circle cx="59" cy="48" r="3.5" fill="#F43F5E" opacity="0.2" />

              {/* Eyes */}
              <ellipse cx="43" cy="42" rx="2.5" ry="1.5" fill="#110C0A" />
              <ellipse cx="57" cy="42" rx="2.5" ry="1.5" fill="#110C0A" />
              <circle cx="44" cy="41.5" r="0.7" fill="#FFFFFF" />
              <circle cx="58" cy="41.5" r="0.7" fill="#FFFFFF" />
              {/* Eyebrows */}
              <path d="M39,38 C41,37 44,38 46,39" fill="none" stroke="#110C0A" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M61,38 C59,37 56,38 54,39" fill="none" stroke="#110C0A" strokeWidth="1.2" strokeLinecap="round" />

              {/* Smiling Mouth */}
              <path d="M45,50 C47,53 53,53 55,50" fill="none" stroke="#E11D48" strokeWidth="2.5" strokeLinecap="round" />

              {/* Nose */}
              <path d="M49,45 L50,47 L51,45" fill="none" stroke="#D1A080" strokeWidth="1" strokeLinecap="round" />

              {/* Hair (Short neat hair with bangs) */}
              <path d="M34,44 C34,25 39,21 50,21 C61,21 66,25 66,44 C66,48 63,47 63,43 C63,35 61,27 50,27 C39,27 37,35 37,43 C37,47 34,48 34,44 Z" fill="url(#hairGrad)" />
              {/* Bangs */}
              <path d="M37,29 Q42,35 45,33 M45,27 Q50,34 52,31 M52,27 Q56,35 61,29" fill="none" stroke="#110C0A" strokeWidth="2.2" strokeLinecap="round" />

              {/* Sun Hat (Cream straw hat) */}
              {/* Hat Crown */}
              <path d="M34,22 C34,13 38,10 50,10 C62,10 66,13 66,22 Z" fill="url(#hatGrad)" stroke="#C4B594" strokeWidth="0.5" />
              {/* Brown Ribbon Band on Hat */}
              <path d="M33.8,20 C35,21 40,22 50,22 C60,22 65,21 66.2,20 L66,22 C66,22 60,24 50,24 C40,24 34,22 34,22 Z" fill="#78350F" />
              {/* Sun Hat Brim (Wide sun-protecting brim from photo) */}
              <ellipse cx="50" cy="23" rx="22" ry="3.5" fill="url(#hatGrad)" stroke="#C4B594" strokeWidth="0.8" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-[#3E3025] flex items-center gap-1.5">
              XẾP THẺ DOMINO TẠO THÔNG ĐIỆP
              <span className="text-xs bg-amber-800/10 text-amber-900 font-mono font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                THPT Co-op
              </span>
            </h1>
            <p className="text-xs text-amber-900 font-bold tracking-wide uppercase flex items-center gap-1.5">
              BẢN QUYỀN TRÒ CHƠI THUỘC VỀ CÔ NGỌC PHƯỢNG
            </p>
          </div>
        </div>

        {/* Audio controls */}
        <div className="flex items-center gap-3 bg-[#FAF7F0] p-1.5 border border-amber-900/5 rounded-lg shadow-inner">
          <button
            onClick={() => {
              setIsMuted(!isMuted);
              speakVoice(isMuted ? "Đã bật âm thanh" : "");
            }}
            className={`p-2 rounded-md transition-all flex items-center gap-1.5 font-bold text-xs ${
              isMuted
                ? "bg-red-500/10 text-red-700 hover:bg-red-500/20"
                : "bg-emerald-600/10 text-emerald-800 hover:bg-emerald-600/20"
            }`}
            title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{isMuted ? "MUTE" : "SOUND ON"}</span>
          </button>

          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`p-2 rounded-md transition-all text-xs font-bold ${
              voiceEnabled
                ? "bg-amber-800/10 text-amber-900 hover:bg-amber-800/20"
                : "bg-gray-400/10 text-gray-500 hover:bg-gray-400/20"
            }`}
            title="Đọc phát âm kết quả đúng/sai"
          >
            🔊 GIỌNG NÓI: {voiceEnabled ? "BẬT" : "TẮT"}
          </button>
        </div>
      </header>

      {/* DÒNG 1: BẢNG ĐIỀU KHIỂN & CÀI ĐẶT (NẰM TRÊN CÙNG) */}
      {!isGameActive ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mb-3">
          
          {/* CỘT TRÁI (col-span-8): CHỌN KHỐI LỚP & CHỦ ĐỀ HÓA HỌC */}
          <div className="xl:col-span-8 bg-[#FCFAF5] p-4 sm:p-5 rounded-xl border border-amber-900/10 shadow-sm flex flex-col justify-between">
            <div>
              {/* Tiêu đề & Giới thiệu */}
              <div className="flex items-center justify-between border-b border-amber-900/10 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-700/10 text-amber-800 rounded-lg">
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-display font-bold text-amber-950 uppercase tracking-wide">
                      BƯỚC 1: CHỌN KHỐI LỚP & CHỦ ĐỀ HÓA HỌC THPT
                    </h2>
                    <p className="text-[11px] text-[#5D5043] font-medium">
                      Nhấp chọn khối lớp và chủ đề bài học mong muốn. Hệ thống sẽ tự động nạp chuỗi câu hỏi domino mẫu chuẩn.
                    </p>
                  </div>
                </div>
              </div>

              {/* Nút Chọn Khối Lớp */}
              <div className="mb-4">
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block mb-2">
                  1. CHỌN KHỐI LỚP HỌC:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 11, 12].map((g) => {
                    const isActive = grade === g;
                    const details =
                      g === 10
                        ? "Nguyên tử & Liên kết"
                        : g === 11
                        ? "Cân bằng & Hữu cơ"
                        : "Este, Polime & Kim loại";
                    return (
                      <button
                        key={g}
                        id={`btn-grade-${g}`}
                        onClick={() => handleGradeChange(g)}
                        className={`py-3 px-3 rounded-xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-1 shadow-sm ${
                          isActive
                            ? "bg-amber-800 text-white border-amber-900 ring-4 ring-amber-700/20 scale-[1.02] shadow-md"
                            : "bg-[#FAF8F5] text-amber-950 hover:bg-amber-100/50 hover:border-amber-700/35 border-amber-900/15"
                        }`}
                      >
                        <span className="text-sm font-display font-black tracking-wider">
                          KHỐI LỚP {g}
                        </span>
                        <span
                          className={`text-[10px] font-medium leading-none ${
                            isActive ? "text-amber-200" : "text-amber-800/70"
                          }`}
                        >
                          {details}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Danh sách Chủ đề tương ứng */}
              <div>
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block mb-2">
                  2. CHỌN CHỦ ĐỀ BÀI HỌC (GỢI Ý SẴN CHO TRÒ CHƠI):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {GRADE_TEMPLATES.find((t) => t.grade === grade)?.topics.map((topic) => {
                    const isSelected = selectedTopicId === topic.id;
                    return (
                      <button
                        key={topic.id}
                        onClick={() => handleTopicChange(topic.id)}
                        className={`group text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex gap-3 items-start relative h-full ${
                          isSelected
                            ? "bg-white border-2 scale-[1.01] shadow-md"
                            : "bg-[#FAF8F5] hover:bg-white border-amber-900/10 hover:border-amber-900/20 hover:shadow-sm"
                        }`}
                        style={{
                          borderColor: isSelected ? topic.color : undefined,
                        }}
                      >
                        {/* Topic Icon Container */}
                        <div
                          className="p-2.5 rounded-xl text-white shadow-sm flex-shrink-0 transition-transform group-hover:scale-110"
                          style={{ backgroundColor: topic.color }}
                        >
                          {renderTopicIcon(topic.iconName, "w-5 h-5")}
                        </div>

                        {/* Topic Texts */}
                        <div className="flex-1 min-w-0 pr-4">
                          <h3
                            className="text-xs sm:text-sm font-bold tracking-tight line-clamp-1 group-hover:text-amber-950 transition-colors"
                            style={{ color: isSelected ? topic.color : "#2C2520" }}
                          >
                            {topic.title}
                          </h3>
                          <p className="text-[11px] text-amber-900/70 line-clamp-2 mt-1 leading-relaxed">
                            {topic.description}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-[10px] font-semibold text-amber-800/60">
                            <span className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-900/5">
                              <BookOpen className="w-3 h-3 text-amber-700" />
                              {topic.data.length} câu hỏi nối đuôi
                            </span>
                            {isSelected && (
                              <span className="text-emerald-700 flex items-center gap-0.5 font-bold">
                                <CheckCircle className="w-3 h-3 text-emerald-600 fill-current text-white" /> Đang chọn
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Selected Indicator dot */}
                        {isSelected && (
                          <div
                            className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full animate-ping"
                            style={{ backgroundColor: topic.color }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Preview of current questions */}
            <div className="mt-4 pt-3.5 border-t border-amber-900/10 bg-amber-500/5 p-3 rounded-lg flex items-center justify-between text-xs font-semibold text-amber-900">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span>
                  Chủ đề hoạt động: <span className="underline font-bold text-amber-950">{
                    GRADE_TEMPLATES.find((t) => t.grade === grade)?.topics.find((t) => t.id === selectedTopicId)?.title || "Chủ đề tùy chọn"
                  }</span>
                </span>
              </div>
              <span className="text-[10px] bg-amber-700 text-white px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                Mẫu câu chuẩn Domino
              </span>
            </div>
          </div>

          {/* CỘT PHẢI (col-span-4): THIẾT LẬP THÊM & NÚT CHƠI */}
          <div className="xl:col-span-4 flex flex-col gap-3">
            
            {/* Hộp Số Câu Hỏi Tối Đa */}
            <div className="bg-[#FCFAF5] p-3.5 rounded-xl border border-amber-900/10 flex flex-col justify-between shadow-sm flex-1 min-h-[120px]">
              <div>
                <label className="text-xs font-display font-bold text-amber-900 tracking-wider uppercase block mb-1 flex items-center gap-1.5">
                  <BookmarkCheck className="w-4 h-4 text-amber-700" /> BƯỚC 2: SỐ CÂU HỎI CHƠI
                </label>
                <p className="text-[11px] text-[#5D5043] leading-relaxed">
                  Thiết lập giới hạn số câu (N câu hỏi tạo ra N+1 thẻ domino).
                </p>
              </div>

              <div className="mt-2.5 space-y-1.5">
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={maxQuestions}
                    onChange={(e) => {
                      const val = Math.min(20, Math.max(1, Number(e.target.value)));
                      setMaxQuestions(val);
                    }}
                    className="w-16 text-center bg-[#FAF8F5] border border-amber-900/20 rounded-lg py-1 px-1.5 text-base font-bold text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-700/40"
                  />
                  <input
                    type="range"
                    min={1}
                    max={Math.min(20, GRADE_TEMPLATES.find((t) => t.grade === grade)?.topics.find((t) => t.id === selectedTopicId)?.data.length || 20)}
                    value={maxQuestions}
                    onChange={(e) => setMaxQuestions(Number(e.target.value))}
                    className="flex-1 accent-amber-800 cursor-pointer"
                  />
                </div>

                {/* Quick Select Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[9px] font-bold text-amber-900/60 uppercase">Chọn nhanh:</span>
                  {[5, 10, 15, Math.min(20, GRADE_TEMPLATES.find((t) => t.grade === grade)?.topics.find((t) => t.id === selectedTopicId)?.data.length || 11)].map((num) => {
                    const isTotal = num === Math.min(20, GRADE_TEMPLATES.find((t) => t.grade === grade)?.topics.find((t) => t.id === selectedTopicId)?.data.length || 11);
                    return (
                      <button
                        key={num}
                        onClick={() => setMaxQuestions(num)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-all cursor-pointer ${
                          maxQuestions === num
                            ? "bg-amber-800 text-white border-amber-900 shadow-sm"
                            : "bg-[#FAF8F5] text-amber-950 border-amber-900/10 hover:bg-amber-100/50"
                        }`}
                      >
                        {isTotal ? "Tất cả" : `${num} câu`}
                      </button>
                    );
                  })}
                </div>

                {/* Auto-shuffle setting */}
                <div className="flex items-center gap-2 pt-2 border-t border-amber-900/10 mt-2">
                  <input
                    type="checkbox"
                    id="chk-auto-shuffle"
                    checked={autoShuffle}
                    onChange={(e) => setAutoShuffle(e.target.checked)}
                    className="w-4 h-4 accent-amber-800 rounded cursor-pointer"
                  />
                  <label
                    htmlFor="chk-auto-shuffle"
                    className="text-[11px] font-bold text-amber-950 cursor-pointer select-none flex items-center gap-1"
                  >
                    🔄 Tự động đảo thẻ chờ khi ghép đúng
                  </label>
                </div>
              </div>
            </div>

            {/* Hộp Ảnh Thông Điệp */}
            <div className="bg-[#FCFAF5] p-3.5 rounded-xl border border-amber-900/10 flex flex-col justify-between shadow-sm flex-1">
              <div>
                <label className="text-xs font-display font-bold text-amber-900 tracking-wider uppercase block mb-1.5 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-amber-700" /> BƯỚC 3: ẢNH THÔNG ĐIỆP ẨN
                </label>
                
                {/* Presets Grid */}
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  {PRESET_IMAGES.map((img) => {
                    const isActive = bgImageUrl === img.url;
                    return (
                      <button
                        key={img.id}
                        onClick={() => selectPresetImage(img.url, img.name)}
                        className={`text-[10px] font-bold py-1.5 px-2 rounded-lg border text-left transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-xs truncate ${
                          isActive
                            ? "bg-amber-800 text-white border-amber-900 ring-2 ring-amber-700/30 scale-[1.01] shadow-xs"
                            : "bg-[#FAF8F5] text-amber-950 hover:bg-amber-100/50 hover:border-amber-700/35 border-amber-900/15"
                        }`}
                      >
                        <span 
                          className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse"
                          style={{ backgroundColor: img.color }}
                        />
                        <span className="truncate">{img.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                {/* File Upload Input */}
                <div className="relative">
                  <input
                    type="file"
                    id="image-file-upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="image-file-upload"
                    className="w-full flex items-center justify-center gap-1.5 bg-[#FAF8F5] border border-dashed border-amber-950/20 hover:bg-amber-100/50 cursor-pointer rounded-lg py-1 px-2 text-center text-[11px] font-bold text-amber-900 transition-all"
                  >
                    <Upload className="w-3 h-3 text-amber-700" />
                    {customImageName ? (
                      <span className="truncate max-w-[150px]">{customImageName}</span>
                    ) : (
                      "Tải ảnh từ máy tính (.jpg, .png)"
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* Hộp Soạn / Điều Chỉnh JSON (Ô 3) */}
            <div className="bg-[#FCFAF5] p-3 rounded-xl border border-amber-900/10 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-display font-bold text-amber-900 tracking-wider uppercase flex items-center gap-1">
                    <FileJson className="w-3.5 h-3.5 text-amber-700" /> BƯỚC 4: XEM & TÙY BIẾN CÂU HỎI
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleFormatJson}
                      className="text-[9px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-950 px-1 py-0.5 border border-amber-900/10 rounded transition-all cursor-pointer"
                      title="Định dạng lại chuỗi JSON cho đẹp mắt"
                    >
                      Định dạng
                    </button>
                    <button
                      onClick={handleRestoreTemplate}
                      className="text-[9px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 px-1 py-0.5 border border-amber-900/10 rounded transition-all cursor-pointer"
                      title="Khôi phục câu hỏi mẫu của chủ đề đang chọn"
                    >
                      Khôi phục
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-[#5D5043] mb-1.5 leading-relaxed">
                  Có thể trực tiếp thay đổi câu hỏi & đáp án dưới đây:
                </p>
              </div>
              <textarea
                value={jsonInput}
                onChange={(e) => {
                  setJsonInput(e.target.value);
                  setJsonError(null);
                }}
                rows={2}
                placeholder="Nhập mảng JSON câu hỏi - đáp án..."
                className="w-full text-[10px] font-mono bg-[#FAF8F5] border border-amber-900/20 rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-amber-700/40 overflow-y-auto resize-y h-[70px] min-h-[50px]"
              />
              {jsonError && (
                <div className="text-[9px] bg-red-50 text-red-700 p-1.5 rounded font-semibold border border-red-200 mt-1 flex items-start gap-1">
                  <span className="flex-shrink-0 text-red-500">⚠️</span>
                  <span>{jsonError}</span>
                </div>
              )}
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartGame}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white font-display font-bold py-3 rounded-xl text-sm shadow-md transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current animate-pulse" />
              BẮT ĐẦU HOẠT ĐỘNG CHƠI
            </button>

          </div>

        </div>
      ) : (
        // ACTIVE GAME CONTROL BAR (Takes less space to maximize playground)
        <div className="bg-[#FAF8F2] p-3 rounded-xl border border-amber-900/15 flex flex-wrap items-center justify-between gap-4 mb-2 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Lớp học:
              </span>
              <span className="bg-amber-700 text-white font-display font-bold px-3 py-1 text-sm rounded-lg shadow-sm">
                {GRADE_TEMPLATES.find(t => t.grade === grade)?.subject}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2 border-l border-amber-900/15 pl-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5D5043]">
                Chủ đề:
              </span>
              <span className="text-sm font-bold text-amber-900">
                {GRADE_TEMPLATES.find(t => t.grade === grade)?.topics.find(t => t.id === selectedTopicId)?.title || "Chủ đề tùy chỉnh"}
              </span>
            </div>
          </div>

          {/* Quick actions for active game */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImageOnCards(!showImageOnCards)}
              className={`p-2 rounded-lg transition-all text-xs font-bold flex items-center gap-1.5 ${
                showImageOnCards
                  ? "bg-amber-800/10 text-amber-900 hover:bg-amber-800/20"
                  : "bg-gray-400/10 text-gray-500 hover:bg-gray-400/20"
              }`}
              title="Ẩn/Hiện hình ảnh nền trên các thẻ đã xếp đúng"
            >
              {showImageOnCards ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>ẢNH NỀN: {showImageOnCards ? "HIỆN" : "ẨN"}</span>
            </button>

            <button
              onClick={() => {
                const newVal = !autoShuffle;
                setAutoShuffle(newVal);
                speakVoice(newVal ? "Đã bật tự động đảo thẻ sau mỗi lượt ghép" : "Đã tắt tự động đảo thẻ");
              }}
              className={`p-2 rounded-lg transition-all text-xs font-bold flex items-center gap-1.5 ${
                autoShuffle
                  ? "bg-emerald-600/10 text-emerald-800 hover:bg-emerald-600/20"
                  : "bg-gray-400/10 text-gray-500 hover:bg-gray-400/20"
              }`}
              title="Tự động xáo trộn ngẫu nhiên các thẻ còn lại trong kho sau mỗi lần ghép chính xác"
            >
              <Sparkles className="w-4 h-4" />
              <span>TỰ ĐỘNG ĐẢO THẺ: {autoShuffle ? "BẬT" : "TẮT"}</span>
            </button>

            {/* Hint Button */}
            <button
              onClick={handleAutoSolveOne}
              disabled={victory || deckCards.length === 0}
              className="px-3 py-2 bg-amber-100 text-amber-900 font-bold text-xs rounded-lg border border-amber-900/15 hover:bg-amber-200/60 disabled:opacity-50 transition-all flex items-center gap-1"
            >
              <Compass className="w-3.5 h-3.5" />
              GỢI Ý 1 THẺ
            </button>

            {/* Restart Button */}
            <button
              onClick={handleResetGame}
              className="px-3 py-2 bg-[#FCFAF5] border border-amber-900/10 text-amber-900 hover:bg-amber-100/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              CÀI ĐẶT LẠI
            </button>
          </div>
        </div>
      )}

      {/* DÒNG 2: TIẾN ĐỘ & GỢI Ý (CHỈ HIỂN THỊ KHI ĐANG CHƠI) */}
      {isGameActive && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-2.5">
          
          {/* Ô Trái: Đang tìm đáp án cho... (Hiển thị VẾ PHẢI của thẻ cuối cùng) */}
          <div className="md:col-span-8 bg-[#FFFDF9] border-2 border-amber-700/20 rounded-xl p-3 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
              <span className="animate-ping w-2.5 h-2.5 bg-amber-600 rounded-full inline-block"></span>
              <span className="text-xs font-display font-bold text-amber-800 tracking-wider uppercase">
                YÊU CẦU: TÌM ĐÁP ÁN CHO VẾ PHẢI (CÂU HỎI) CỦA THẺ CUỐI CÙNG:
              </span>
            </div>
            
            <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-900/10 text-center flex items-center justify-center min-h-[50px] shadow-inner tex2jax_process">
              <p className="text-base sm:text-lg md:text-xl font-bold text-amber-950 tracking-tight leading-snug">
                {victory ? (
                  <span className="text-emerald-700 flex items-center gap-2 justify-center">
                    🎉 ĐÃ HOÀN THÀNH TOÀN BỘ CHUỖI DOMINO!
                  </span>
                ) : (
                  currentTargetQuestionText || "Bắt đầu xếp dải Domino..."
                )}
              </p>
            </div>
          </div>

          {/* Ô Phải: Bộ đếm tiến độ & Thanh tỉ lệ */}
          <div className="md:col-span-4 bg-[#FFFDF9] border border-amber-900/10 rounded-xl p-3 shadow-sm flex flex-col justify-center">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-display font-bold text-amber-800 uppercase tracking-wider">
                TIẾN ĐỘ GIẢI MÃ:
              </span>
              <span className="text-sm font-mono font-bold bg-amber-800/10 text-amber-950 px-2.5 py-0.5 rounded-full">
                {chainCards.length - 1} / {chainCards.length + deckCards.length - 1} Thẻ
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-amber-900/10 rounded-full h-3.5 overflow-hidden shadow-inner p-0.5">
              <div
                className="bg-gradient-to-r from-amber-600 to-amber-700 h-2.5 rounded-full transition-all duration-500 ease-out shadow-sm"
                style={{
                  width: `${
                    ((chainCards.length - 1) / (chainCards.length + deckCards.length - 1 || 1)) * 100
                  }%`
                }}
              ></div>
            </div>

            <div className="flex justify-between items-center mt-1.5 text-[10px] font-bold text-amber-900/70">
              <span>BẮT ĐẦU</span>
              <span>{Math.round(((chainCards.length - 1) / (chainCards.length + deckCards.length - 1 || 1)) * 100)}% HOÀN THÀNH</span>
              <span>THÔNG ĐIỆP</span>
            </div>
          </div>

        </div>
      )}

      {/* DÒNG 3: KHU VỰC CHƠI CHÍNH (CHIẾM 60-70% DIỆN TÍCH MÀN HÌNH) */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[350px] mb-2.5 h-[calc(100vh-320px)] lg:h-[calc(100vh-290px)] max-h-[850px]">
        
        {/* Ô TRÁI: KHO THẺ CHỜ (35% hoặc 40% width) */}
        <div className="lg:col-span-4 flex flex-col bg-[#FCFAF5] border border-amber-900/10 rounded-2xl p-3.5 shadow-sm overflow-hidden h-full">
          <div className="flex justify-between items-center border-b border-amber-900/10 pb-2 mb-3">
            <h2 className="text-sm font-display font-bold text-[#3E3025] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-700"></span>
              KHO THẺ CHỜ ({deckCards.length} thẻ)
            </h2>
            <div className="flex items-center gap-2">
              {isGameActive && deckCards.length > 1 && (
                <button
                  onClick={handleManualShuffle}
                  className="text-[10px] font-bold bg-amber-800/10 text-amber-950 hover:bg-amber-800/20 px-2 py-0.5 rounded border border-amber-900/15 transition-all cursor-pointer flex items-center gap-1"
                  title="Xáo trộn ngẫu nhiên thứ tự các thẻ chờ"
                >
                  🔄 Đảo thẻ
                </button>
              )}
              <span className="text-[10px] bg-amber-800/10 text-amber-900 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                Kéo thả thẻ đúng sang Phải
              </span>
            </div>
          </div>

          {/* Deck Cards scroll container */}
          <div className="flex-grow overflow-y-auto pr-1 space-y-3 pb-10">
            {!isGameActive ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-amber-800/60">
                <Compass className="w-12 h-12 stroke-[1.25] mb-2 text-amber-700/40" />
                <p className="text-sm font-semibold">Chưa bắt đầu trò chơi.</p>
                <p className="text-xs mt-1">Vui lòng thiết lập cấu hình ở dòng trên rồi bấm nút <strong className="text-amber-800">"BẮT ĐẦU CHƠI"</strong>.</p>
              </div>
            ) : deckCards.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-emerald-800 bg-emerald-50/50 rounded-xl border border-emerald-200">
                <CheckCircle className="w-12 h-12 mb-2 text-emerald-600 stroke-[1.5]" />
                <p className="text-base font-bold">TUYỆT VỜI!</p>
                <p className="text-xs font-semibold mt-1">Tất cả các mảnh Domino đã được nối kết chính xác.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {deckCards.map((card) => {
                  const isWrong = wrongCardId === card.id;
                  return (
                    <div
                      key={card.id}
                      draggable={!victory}
                      onDragStart={(e) => handleDragStart(e, card.id)}
                      onDragEnd={handleDragEnd}
                      className={`domino-clip relative w-full h-[85px] sm:h-[90px] flex flex-row items-center cursor-grab active:cursor-grabbing transition-all duration-200 select-none bg-[#FCFAF7] border-2 border-amber-800/10 shadow-sm hover:shadow-md hover:border-amber-700/30 hover:scale-[1.01] ${
                        isWrong ? "border-red-500 animate-flash-red" : ""
                      }`}
                    >
                      {/* Left Half (Vế Trái - Answer) */}
                      <div className="w-1/2 h-full flex flex-col justify-between p-2 text-center border-r border-dashed border-amber-900/15 relative bg-amber-50/20">
                        <span className="text-[9px] font-semibold text-amber-800 bg-amber-800/5 px-1 py-0.5 rounded self-center uppercase tracking-wider">
                          ĐÁP ÁN (VẾ TRÁI)
                        </span>
                        <div className="flex-grow flex items-center justify-center overflow-hidden">
                          <p className="text-xs sm:text-sm font-bold text-gray-900 tracking-tight leading-tight px-1 max-h-[48px] overflow-y-auto tex2jax_process">
                            {card.answer}
                          </p>
                        </div>
                      </div>

                      {/* Divider Central Peg */}
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-amber-800/20 border border-amber-800/35 z-10"></div>

                      {/* Right Half (Vế Phải - Question) */}
                      <div className="w-1/2 h-full flex flex-col justify-between p-2 text-center bg-white">
                        <span className="text-[9px] font-semibold text-amber-700 bg-amber-500/5 px-1 py-0.5 rounded self-center uppercase tracking-wider">
                          CÂU HỎI TIẾP (VẾ PHẢI)
                        </span>
                        <div className="flex-grow flex items-center justify-center overflow-hidden">
                          <p className="text-xs sm:text-sm font-bold text-amber-950 tracking-tight leading-tight px-1 max-h-[48px] overflow-y-auto tex2jax_process">
                            {card.question}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Ô PHẢI: DẢI DOMINO ĐÃ NỐI (DROPZONE) (60% hoặc 65% width) */}
        <div className="lg:col-span-8 flex flex-col bg-[#FAF7F0] border-2 border-amber-900/10 rounded-2xl p-3.5 shadow-sm overflow-hidden h-full relative">
          <div className="flex justify-between items-center border-b border-amber-900/10 pb-2 mb-3">
            <h2 className="text-sm font-display font-bold text-[#3E3025] uppercase tracking-wider flex items-center gap-1.5">
              <Tv className="w-4.5 h-4.5 text-amber-800 animate-pulse" />
              DẢI DOMINO ĐÃ NỐI • GIẢI MÃ THÔNG ĐIỆP
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-900/80 font-bold bg-amber-100 px-2 py-0.5 rounded border border-amber-900/5">
                START CARD TỰ ĐỘNG KHÓA ĐẦU
              </span>
            </div>
          </div>

          {/* Connected Domino chain list container */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDropOnZone}
            className={`flex-grow overflow-x-auto overflow-y-auto p-4 rounded-xl transition-all relative ${
              isOverDropzone
                ? "bg-amber-800/10 ring-4 ring-amber-700/20 border-2 border-dashed border-amber-700"
                : "bg-amber-900/5 border border-amber-900/10 shadow-inner"
            }`}
          >
            {!isGameActive ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-amber-800/60">
                <Sparkles className="w-12 h-12 stroke-[1.25] mb-2 text-amber-700/30" />
                <p className="text-sm font-semibold">Bản đồ nối dải Domino.</p>
                <p className="text-xs mt-1">Khi bắt đầu, thẻ START đầu tiên sẽ được đặt sẵn tại đây.</p>
              </div>
            ) : (
              <div className="h-full flex flex-col justify-between">
                
                {/* Horizontal / Wrapped Domino list */}
                <div className="flex flex-wrap items-center gap-x-0.5 gap-y-3.5 p-2 pb-16 justify-start">
                  {chainCards.map((card, i) => {
                    const isNewest = correctCardId === card.id;
                    const showImage = showImageOnCards;

                    return (
                      <div
                        key={card.id}
                        className={`domino-clip relative w-[230px] sm:w-[250px] h-[85px] sm:h-[90px] flex flex-row items-center transition-all duration-300 select-none shadow-sm -ml-3 first:ml-0 ${
                          isNewest ? "scale-[1.04] ring-4 ring-emerald-500/50 z-20" : ""
                        }`}
                        style={{
                          backgroundImage: showImage ? `url(${bgImageUrl})` : "none",
                          backgroundSize: showImage ? card.bgWidth : "none",
                          backgroundPosition: showImage ? `${card.bgPositionX} ${card.bgPositionY}` : "none",
                          backgroundColor: showImage ? "transparent" : "#FDFCFA",
                          border: showImage ? "none" : "2px solid rgba(139, 92, 26, 0.2)"
                        }}
                      >
                        {/* Glassmorphic/translucent text backdrop to ensure readability */}
                        <div className="absolute inset-0 bg-white/85 backdrop-blur-[0.5px] z-0 domino-clip"></div>

                        {/* Left Half (Vế Trái - Answer) */}
                        <div className="w-1/2 h-full flex flex-col justify-between p-2 text-center border-r border-dashed border-amber-900/15 relative z-10">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded self-center ${
                            card.isStart ? "bg-amber-800 text-white" : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {card.isStart ? "BẮT ĐẦU" : "ĐÁP ÁN"}
                          </span>
                          <div className="flex-grow flex items-center justify-center overflow-hidden">
                            <p className="text-xs sm:text-sm font-extrabold text-gray-900 tracking-tight leading-tight px-1 max-h-[48px] overflow-y-auto tex2jax_process">
                              {card.answer}
                            </p>
                          </div>
                        </div>

                        {/* Divider Central Peg */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-amber-800/30 border border-amber-800/50 z-20"></div>

                        {/* Right Half (Vế Phải - Question) */}
                        <div className="w-1/2 h-full flex flex-col justify-between p-2 text-center relative z-10">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded self-center ${
                            card.isEnd ? "bg-red-800 text-white" : "bg-amber-100 text-amber-800"
                          }`}>
                            {card.isEnd ? "KẾT THÚC" : "CÂU HỎI"}
                          </span>
                          <div className="flex-grow flex items-center justify-center overflow-hidden">
                            <p className="text-xs sm:text-sm font-bold text-amber-950 tracking-tight leading-tight px-1 max-h-[48px] overflow-y-auto tex2jax_process">
                              {card.question}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* DROP SLOT INTERACTIVE PLACEHOLDER */}
                  {!victory && (
                    <div
                      className={`domino-clip relative w-[230px] sm:w-[250px] h-[85px] sm:h-[90px] flex flex-col items-center justify-center border-3 border-dashed rounded-lg transition-all duration-150 -ml-3 ${
                        isOverDropzone
                          ? "border-emerald-600 bg-emerald-500/10 text-emerald-800 scale-[1.03]"
                          : "border-amber-800/30 bg-amber-900/5 text-amber-800/60"
                      }`}
                    >
                      <div className="text-center p-2">
                        <p className="text-xs font-display font-extrabold tracking-wider uppercase animate-pulse">
                          THẢ THẺ TIẾP THEO
                        </p>
                        <p className="text-[10px] font-semibold mt-0.5">
                          Đáp án đúng của vế trái
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Empty anchor ref for scrolling */}
                  <div ref={chainEndRef} className="w-2" />
                </div>

                {/* VICTORY OVERLAY / MESSAGE REVEAL PANEL */}
                {victory && (
                  <div className="absolute inset-0 bg-[#0F0A05]/95 flex flex-col items-center justify-center text-center p-6 z-30 transition-all duration-700 animate-fade-in rounded-xl">
                    <div className="max-w-xl space-y-4">
                      {/* Badge */}
                      <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-1.5 rounded-full text-sm font-display font-bold uppercase tracking-wider animate-bounce">
                        <Sparkles className="w-4 h-4 fill-current" />
                        GIẢI MÃ THÀNH CÔNG THÔNG ĐIỆP ẨN GIẤU!
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
                        XUẤT SẮC! CẢ LỚP ĐÃ HOÀN THÀNH XUẤT SẮC
                      </h2>
                      
                      {/* Image Preview Container without cards overlaid, showing the whole image */}
                      <div className="relative border-4 border-amber-500 rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(234,88,12,0.3)] mx-auto w-full max-w-md aspect-[16/10] bg-black group ring-4 ring-amber-500/10">
                        <img
                          id="victory-reveal-image"
                          src={bgImageUrl}
                          alt="Hidden Message Reveal"
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center p-3">
                          <p className="text-white text-xs font-display font-bold tracking-wider uppercase drop-shadow">
                            🍁 Bức tranh mùa thu sinh động hữu tình 🍁
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-amber-100/80 leading-relaxed font-semibold">
                        Cám ơn các em học sinh đã cùng đồng hành giải mã dải Domino kiến thức. Hãy giữ vững tinh thần hiếu học và đoàn kết này nhé!
                      </p>

                      {/* Action buttons */}
                      <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                          onClick={handleResetGame}
                          className="px-6 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-display font-bold rounded-lg shadow transition-all flex items-center gap-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          CHƠI LẠI TRẬN MỚI
                        </button>
                        
                        <button
                          onClick={() => {
                            setVictory(false);
                            speakVoice("Mở chế độ xem dải thẻ đã nối.");
                          }}
                          className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-display font-bold rounded-lg border border-white/20 transition-all"
                        >
                          XEM CHI TIẾT DẢI THẺ
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>

      </div>

      {/* DÒNG 4: ÂM THANH & ĐIỀU HƯỚNG / HƯỚNG DẪN CHƠI (NẰM DƯỚI CÙNG) */}
      <footer className="bg-[#FCFAF5] border border-amber-900/10 rounded-xl p-3 shadow-sm text-xs text-[#5D5043]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Instructions */}
          <div className="flex items-center gap-2 flex-grow">
            <Info className="w-5 h-5 text-amber-800 flex-shrink-0" />
            <div>
              <p className="font-bold text-amber-900 uppercase tracking-wide text-[10px]">
                HƯỚNG DẪN DÀNH CHO HỌC SINH (BẢNG TRỰC QUAN):
              </p>
              <p className="text-[#5D5043] leading-relaxed text-[11px]">
                1. Đọc kỹ câu hỏi ở <strong>Vế Phải</strong> của thẻ cuối cùng bên Dải nối • 
                2. Tìm thẻ trong <strong>Kho thẻ chờ</strong> có vế trái là câu trả lời chính xác • 
                3. Kéo và thả thẻ đó vào ô <strong>"Thả thẻ tiếp theo"</strong>.
              </p>
            </div>
          </div>

          {/* Quick Stats / Tech details hidden / Pure game credits */}
          <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-amber-900/10 pt-2 sm:pt-0 sm:pl-4 flex-shrink-0 text-[11px] font-semibold text-amber-900/80">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
              <span>Đọc tự động tiếng Việt: Sẵn sàng</span>
            </div>
            <div>
              <span>Hỗ trợ MathJax 3 & Công thức LaTeX</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
