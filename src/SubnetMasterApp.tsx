import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, Lock, Building, Wifi, Users, Globe, Briefcase, Trophy, Star, Play, Home, Target, Clock, CheckCircle, AlertCircle, Check, X } from 'lucide-react';

const SubnetMasterApp = () => {
  const [currentView, setCurrentView] = useState('intro');
  const [currentLevel, setCurrentLevel] = useState(null);
  const [gameState, setGameState] = useState('tutorial');
  const [currentSubnet, setCurrentSubnet] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [feedback, setFeedback] = useState([]);
  const [score, setScore] = useState(0);
  const [scenario, setScenario] = useState(null);
  const [gameProgress, setGameProgress] = useState(() => {
    try {
      const saved = localStorage.getItem('subnetmaster-progress');
      return saved ? JSON.parse(saved) : {
        unlockedLevels: [1],
        completedLevels: [],
        achievements: [],
        totalScore: 0
      };
    } catch {
      return {
        unlockedLevels: [1],
        completedLevels: [],
        achievements: [],
        totalScore: 0
      };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('subnetmaster-progress', JSON.stringify(gameProgress));
    } catch (e) {
      console.error('Could not save progress:', e);
    }
  }, [gameProgress]);

  const generateLevel1Scenario = () => {
    const scenarios = [
      {
        baseNetwork: "192.168.1.0/24",
        requiredSubnets: 4,
        description: "Split into 4 equal subnets",
        story: "The reception area needs 4 separate network segments for different departments."
      },
      {
        baseNetwork: "192.168.10.0/24", 
        requiredSubnets: 2,
        description: "Split into 2 equal subnets",
        story: "Create separate networks for employees and guests."
      },
      {
        baseNetwork: "192.168.50.0/24",
        requiredSubnets: 8, 
        description: "Split into 8 equal subnets",
        story: "Each workgroup needs its own network segment."
      }
    ];
    return scenarios[Math.floor(Math.random() * scenarios.length)];
  };

  const calculateLevel1Solution = (baseNetwork, requiredSubnets) => {
    const subnetBits = Math.ceil(Math.log2(requiredSubnets));
    const newPrefix = 24 + subnetBits;
    const subnetSize = Math.pow(2, 32 - newPrefix);
    const solutions = [];
    
    for (let i = 0; i < requiredSubnets; i++) {
      const baseOctets = baseNetwork.split('.').slice(0, 3).map(Number);
      const networkAddress = `${baseOctets[0]}.${baseOctets[1]}.${baseOctets[2]}.${i * subnetSize}`;
      const broadcastAddress = `${baseOctets[0]}.${baseOctets[1]}.${baseOctets[2]}.${(i + 1) * subnetSize - 1}`;
      const firstHost = `${baseOctets[0]}.${baseOctets[1]}.${baseOctets[2]}.${i * subnetSize + 1}`;
      const lastHost = `${baseOctets[0]}.${baseOctets[1]}.${baseOctets[2]}.${(i + 1) * subnetSize - 2}`;
      
      solutions.push({
        subnetNumber: i + 1,
        networkAddress,
        subnetMask: `255.255.255.${256 - subnetSize}`,
        cidr: `${networkAddress}/${newPrefix}`,
        broadcastAddress,
        firstHost,
        lastHost,
        totalHosts: subnetSize - 2
      });
    }
    
    return { solutions, newPrefix, subnetMask: `255.255.255.${256 - subnetSize}` };
  };

  const validateLevel1Answer = (userAnswer, correctSolution, field) => {
    const correct = correctSolution[field];
    const isCorrect = userAnswer.trim() === correct;
    
    return {
      isCorrect,
      feedback: isCorrect ? 
        `✅ Correct ${field}!` : 
        `❌ Wrong ${field}. Expected: ${correct}, Got: ${userAnswer}`
    };
  };

  const calculateScore = (correctAnswers, totalQuestions) => {
    return Math.round((correctAnswers / totalQuestions) * 100);
  };

  const startLevel = (level) => {
    setCurrentLevel(level);
    setCurrentView('level');
    setGameState('tutorial');
    setCurrentSubnet(0);
    setUserAnswers({});
    setFeedback([]);
    setScore(0);
    
    if (level.id === 1) {
      const newScenario = generateLevel1Scenario();
      setScenario(newScenario);
    }
  };

  const startPlaying = () => {
    setGameState('playing');
  };

  const submitSubnetAnswer = () => {
    if (!scenario || !currentLevel) return;
    
    const solution = calculateLevel1Solution(scenario.baseNetwork, scenario.requiredSubnets);
    const currentSolution = solution.solutions[currentSubnet];
    
    const subnetAnswers = userAnswers[currentSubnet] || {};
    const validations = {
      networkAddress: validateLevel1Answer(subnetAnswers.networkAddress || '', currentSolution, 'networkAddress'),
      subnetMask: validateLevel1Answer(subnetAnswers.subnetMask || '', currentSolution, 'subnetMask'),
      broadcastAddress: validateLevel1Answer(subnetAnswers.broadcastAddress || '', currentSolution, 'broadcastAddress'),
      firstHost: validateLevel1Answer(subnetAnswers.firstHost || '', currentSolution, 'firstHost'),
      lastHost: validateLevel1Answer(subnetAnswers.lastHost || '', currentSolution, 'lastHost')
    };
    
    const correctCount = Object.values(validations).filter(v => v.isCorrect).length;
    const subnetScore = Math.round((correctCount / 5) * 100);
    
    setFeedback(Object.values(validations).map(v => v.feedback));
    
    if (currentSubnet < scenario.requiredSubnets - 1) {
      setTimeout(() => {
        setCurrentSubnet(currentSubnet + 1);
        setFeedback([]);
      }, 3000);
    } else {
      const finalScore = calculateScore(correctCount, scenario.requiredSubnets * 5);
      setScore(finalScore);
      
      if (finalScore >= 80) {
        const newProgress = { ...gameProgress };
        if (!newProgress.completedLevels.includes(currentLevel.id)) {
          newProgress.completedLevels.push(currentLevel.id);
          newProgress.totalScore += finalScore;
        }
        if (currentLevel.id < 6 && !newProgress.unlockedLevels.includes(currentLevel.id + 1)) {
          newProgress.unlockedLevels.push(currentLevel.id + 1);
        }
        setGameProgress(newProgress);
        setGameState('completed');
      } else {
        setGameState('completed');
      }
    }
  };

  const updateSubnetAnswer = (field, value) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentSubnet]: {
        ...prev[currentSubnet],
        [field]: value
      }
    }));
  };

  const levels = [
    {
      id: 1,
      title: "Small Office Network",
      subtitle: "Class C Basics",
      description: "Help the ByteTech small office get their basic network running",
      icon: <Home className="w-8 h-8" />,
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      difficulty: "Beginner",
      estimatedTime: "10 minutes",
      floor: "1st Floor - Reception"
    },
    {
      id: 2,
      title: "Department Networks", 
      subtitle: "Class C VLSM",
      description: "Design efficient networks for different departments",
      icon: <Users className="w-8 h-8" />,
      color: "bg-gradient-to-br from-green-500 to-green-600",
      difficulty: "Intermediate",
      estimatedTime: "15 minutes",
      floor: "2nd Floor - Departments"
    },
    {
      id: 3,
      title: "Corporate Campus",
      subtitle: "Class B Networks", 
      description: "Scale up to enterprise-level networking",
      icon: <Building className="w-8 h-8" />,
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      difficulty: "Advanced",
      estimatedTime: "20 minutes",
      floor: "3rd Floor - Corporate"
    },
    {
      id: 4,
      title: "Enterprise Solutions",
      subtitle: "Class B VLSM",
      description: "Master complex enterprise network design",
      icon: <Wifi className="w-8 h-8" />,
      color: "bg-gradient-to-br from-orange-500 to-orange-600",
      difficulty: "Expert",
      estimatedTime: "25 minutes", 
      floor: "4th Floor - Enterprise"
    },
    {
      id: 5,
      title: "Global Operations",
      subtitle: "Class A Mastery",
      description: "Architect networks for millions of users worldwide",
      icon: <Globe className="w-8 h-8" />,
      color: "bg-gradient-to-br from-red-500 to-red-600",
      difficulty: "Master",
      estimatedTime: "30 minutes", 
      floor: "5th Floor - Global HQ"
    },
    {
      id: 6,
      title: "Consulting Practice",
      subtitle: "Multi-Client Projects",
      description: "Manage multiple client networks simultaneously",
      icon: <Briefcase className="w-8 h-8" />,
      color: "bg-gradient-to-br from-indigo-500 to-indigo-600",
      difficulty: "Expert Consultant",
      estimatedTime: "35 minutes",
      floor: "6th Floor - Executive Suite"
    }
  ];

  const IntroScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="text-center mb-12">
          <div className="mb-6">
            <div className="inline-block p-6 bg-white/10 backdrop-blur-md rounded-full mb-6 border border-white/20">
              <Building className="w-20 h-20 text-blue-400" />
            </div>
            <h1 className="text-7xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent mb-6">
              SubnetMaster Academy
            </h1>
            <p className="text-2xl text-blue-200 max-w-3xl mx-auto leading-relaxed">
              Master network subnetting through an epic journey at <span className="font-bold text-cyan-300">ByteTech Industries</span>
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto mb-16">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-10 border border-white/20 shadow-2xl">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-8 text-transparent bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text">
                  Welcome to ByteTech Industries! 🏢
                </h2>
                <div className="space-y-6 text-lg leading-relaxed">
                  <p className="text-gray-200">
                    You're <span className="font-bold text-blue-300">Alex</span>, a new IT apprentice at ByteTech Industries - a cutting-edge tech company with network challenges on every floor.
                  </p>
                  <p className="text-gray-200">
                    Your mentor <span className="text-green-400 font-bold">NetBot 🤖</span> will guide you through the building, solving increasingly complex subnetting puzzles.
                  </p>
                  <p className="text-gray-200">
                    Each floor presents unique networking challenges. Complete each level to unlock your keycard and advance to the next floor!
                  </p>
                </div>
              </div>
              
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl p-8 border border-blue-400/30 shadow-xl">
                  <div className="text-center mb-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                      <span className="text-3xl">👨‍💻</span>
                    </div>
                    <h3 className="font-bold text-xl text-blue-300">Alex (That's You!)</h3>
                    <p className="text-blue-200">IT Apprentice Level 1</p>
                    <div className="mt-2 bg-blue-500/20 rounded-full h-2">
                      <div className="bg-blue-400 h-2 rounded-full w-1/4 animate-pulse"></div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                      <span className="text-2xl">🤖</span>
                    </div>
                    <h3 className="font-bold text-lg text-green-300">NetBot</h3>
                    <p className="text-green-200">Your AI Mentor</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center hover:bg-white/15 transition-all duration-500 group">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Progressive Mastery</h3>
            <p className="text-gray-300 leading-relaxed">Journey from basic Class C networks to global Class A architectures with 6 carefully crafted levels</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center hover:bg-white/15 transition-all duration-500 group">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-500 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Real-World Scenarios</h3>
            <p className="text-gray-300 leading-relaxed">Solve actual business problems from law firms to hospitals with immediate feedback and professional guidance</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center hover:bg-white/15 transition-all duration-500 group">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-500 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Star className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Gamified Experience</h3>
            <p className="text-gray-300 leading-relaxed">Unlock floors, earn achievements, track progress, and become a certified SubnetMaster consultant</p>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => setCurrentView('building')}
            className="group relative inline-flex items-center px-12 py-6 bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 hover:from-blue-600 hover:via-purple-700 hover:to-indigo-700 rounded-2xl font-bold text-2xl transition-all duration-500 hover:scale-105 hover:shadow-2xl shadow-xl"
          >
            <span className="relative flex items-center">
              <Building className="mr-3 w-7 h-7" />
              Enter ByteTech Industries
              <ChevronRight className="ml-3 w-7 h-7 group-hover:translate-x-1 transition-transform duration-300" />
            </span>
          </button>
          <p className="text-gray-400 mt-4 text-lg">🚀 Begin your networking mastery journey</p>
        </div>
      </div>
    </div>
  );

  const BuildingView = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-12">
          <div className="mb-6 lg:mb-0">
            <h1 className="text-5xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
              ByteTech Industries
            </h1>
            <p className="text-blue-200 text-xl">Choose your floor to begin networking challenges</p>
            <div className="flex items-center mt-3 text-green-400">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span className="text-lg">Welcome back, Alex! 👨‍💻</span>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <div className="text-3xl font-black text-green-400 mb-1">{gameProgress.completedLevels.length}</div>
                <div className="text-sm text-green-200 font-medium">Floors Cleared</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-blue-400 mb-1">{gameProgress.totalScore}</div>
                <div className="text-sm text-blue-200 font-medium">Total Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-purple-400 mb-1">0</div>
                <div className="text-sm text-purple-200 font-medium">Achievements</div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="mb-8 text-center">
            <div className="inline-block bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-gray-300 mb-4">🏢 ByteTech Industries Building</h2>
              <div className="flex justify-center space-x-2">
                {levels.map((level) => {
                  const isUnlocked = gameProgress.unlockedLevels.includes(level.id);
                  const isCompleted = gameProgress.completedLevels.includes(level.id);
                  return (
                    <div key={level.id} className="flex flex-col items-center">
                      <div className={`w-16 h-12 rounded-lg border-2 flex items-center justify-center text-xs font-bold ${
                        isCompleted ? 'bg-green-500/30 border-green-400 text-green-300' :
                        isUnlocked ? 'bg-blue-500/30 border-blue-400 text-blue-300' :
                        'bg-gray-500/20 border-gray-600 text-gray-500'
                      }`}>
                        {isCompleted ? '✓' : isUnlocked ? level.id : '🔒'}
                      </div>
                      <div className="text-xs mt-1 text-gray-400">Floor {level.id}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {levels.map((level, index) => {
              const isUnlocked = gameProgress.unlockedLevels.includes(level.id);
              const isCompleted = gameProgress.completedLevels.includes(level.id);
              
              return (
                <div key={level.id} className="relative group">
                  <div className={`bg-white/10 backdrop-blur-md rounded-2xl p-8 border transition-all duration-500 shadow-xl ${
                    isUnlocked 
                      ? 'border-white/20 hover:border-blue-400/50 hover:bg-white/15 cursor-pointer hover:scale-[1.02] hover:shadow-2xl' 
                      : 'border-gray-600/30 opacity-60'
                  } ${isCompleted ? 'ring-2 ring-green-400/30 bg-green-500/5' : ''}`}>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <div className={`p-4 rounded-2xl text-white flex items-center justify-center shadow-lg ${level.color} ${
                          isUnlocked ? 'group-hover:scale-110' : ''
                        } transition-transform duration-300`}>
                          {level.icon}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-3">
                            <h3 className="text-2xl font-bold">{level.title}</h3>
                            <span className="text-sm px-3 py-1 rounded-full font-medium bg-blue-500/20 text-blue-300">
                              {level.subtitle}
                            </span>
                            {isCompleted && (
                              <div className="flex items-center text-green-400 bg-green-500/20 px-3 py-1 rounded-full">
                                <Trophy className="w-4 h-4 mr-2" />
                                <span className="text-sm font-medium">Mastered</span>
                              </div>
                            )}
                          </div>
                          
                          <p className="text-gray-300 mb-4 text-lg leading-relaxed">{level.description}</p>
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-400">
                            <div className="flex items-center">
                              <span className="mr-2">📍</span>
                              <span>{level.floor}</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2" />
                              <span>{level.estimatedTime}</span>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              level.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-300' :
                              level.difficulty === 'Intermediate' ? 'bg-blue-500/20 text-blue-300' :
                              level.difficulty === 'Advanced' ? 'bg-purple-500/20 text-purple-300' :
                              level.difficulty === 'Expert' ? 'bg-orange-500/20 text-orange-300' :
                              level.difficulty === 'Master' ? 'bg-red-500/20 text-red-300' :
                              'bg-indigo-500/20 text-indigo-300'
                            }`}>
                              {level.difficulty}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        {isUnlocked ? (
                          <button
                            onClick={() => startLevel(level)}
                            className={`px-8 py-4 rounded-xl font-bold transition-all duration-300 flex items-center shadow-lg hover:scale-105 hover:shadow-xl ${
                              isCompleted 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white' 
                                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                            }`}
                          >
                            {isCompleted ? (
                              <>
                                <Trophy className="mr-2 w-5 h-5" />
                                Replay Level
                              </>
                            ) : (
                              <>
                                <Play className="mr-2 w-5 h-5" />
                                Start Challenge
                              </>
                            )}
                            <ChevronRight className="ml-2 w-5 h-5" />
                          </button>
                        ) : (
                          <div className="flex items-center text-gray-500 bg-gray-600/20 px-6 py-4 rounded-xl border border-gray-600/30">
                            <Lock className="w-5 h-5 mr-3" />
                            <span className="font-medium">Complete Level {level.id - 1} to unlock</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {index < levels.length - 1 && (
                    <div className="flex justify-center py-3">
                      <div className={`w-1 h-6 rounded-full transition-all duration-500 ${
                        gameProgress.completedLevels.includes(level.id) 
                          ? 'bg-gradient-to-b from-green-400 to-blue-500 shadow-lg' 
                          : 'bg-gray-600'
                      }`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10 backdrop-blur-md rounded-2xl p-8 border border-green-400/30 shadow-xl">
            <div className="flex items-start space-x-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-2xl">🤖</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-green-300 text-xl mb-3">NetBot says:</h3>
                <div className="text-green-100 text-lg leading-relaxed space-y-3">
                  <p>
                    "Welcome to ByteTech Industries! 🎉 You're about to embark on an incredible journey through network mastery."
                  </p>
                  <p>
                    "Start with <span className="font-bold text-green-300">Level 1</span> to learn the fundamentals, then progress through each floor. 
                    Each level builds on the previous one, so take your time to truly master each concept! 🚀"
                  </p>
                  {gameProgress.completedLevels.length > 0 && (
                    <p className="text-yellow-300">
                      "Great progress! You've completed {gameProgress.completedLevels.length} level{gameProgress.completedLevels.length !== 1 ? 's' : ''}. 
                      Keep up the excellent work! 💪"
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const LevelScreen = () => {
    if (!currentLevel) return null;

    if (gameState === 'tutorial') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
              <button
                onClick={() => setCurrentView('building')}
                className="flex items-center text-blue-400 hover:text-blue-300 transition-colors"
              >
                <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                Back to Building
              </button>
              
              <div className="text-center">
                <h1 className="text-3xl font-bold">{currentLevel.title}</h1>
                <p className="text-blue-200">{currentLevel.floor}</p>
              </div>
              
              <div className="w-20" />
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20">
                <div className="text-center mb-8">
                  <div className={`inline-block p-4 rounded-xl text-white mb-4 ${currentLevel.color}`}>
                    {currentLevel.icon}
                  </div>
                  <h2 className="text-2xl font-bold mb-2">{currentLevel.subtitle}</h2>
                  <p className="text-gray-300 text-lg">{currentLevel.description}</p>
                </div>

                {scenario && (
                  <div className="bg-blue-500/10 backdrop-blur-md rounded-xl p-6 border border-blue-400/30 mb-8">
                    <h3 className="font-bold text-blue-300 text-xl mb-4">📋 Your Challenge:</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-blue-200 mb-2">Network Details:</h4>
                        <p className="text-blue-100">Base Network: <span className="font-mono font-bold">{scenario.baseNetwork}</span></p>
                        <p className="text-blue-100">Required Subnets: <span className="font-bold">{scenario.requiredSubnets}</span></p>
                        <p className="text-blue-100">Task: <span className="font-bold">{scenario.description}</span></p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-200 mb-2">Business Context:</h4>
                        <p className="text-blue-100">{scenario.story}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-green-500/10 backdrop-blur-md rounded-xl p-6 border border-green-400/30 mb-8">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">🤖</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-green-300 mb-2">NetBot Tutorial:</h3>
                      <div className="text-green-100 space-y-2">
                        {currentLevel.id === 1 && (
                          <div>
                            <p>"Welcome to your first networking challenge! 🎯"</p>
                            <p>"You'll need to calculate the new subnet mask and provide details for each subnet."</p>
                            <p>"Remember: subnet bits = log₂(required subnets), new prefix = 24 + subnet bits"</p>
                            <p>"Take your time and think through each step carefully!"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <button
                    onClick={startPlaying}
                    className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105"
                  >
                    Start Subnetting Challenge! 🚀
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (gameState === 'playing') {
      const solution = useMemo(() => {
  return calculateLevel1Solution(scenario.baseNetwork, scenario.requiredSubnets);
}, [scenario.baseNetwork, scenario.requiredSubnets]);

const currentSolution = solution.solutions[currentSubnet];

      
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
              <button
                onClick={() => setCurrentView('building')}
                className="flex items-center text-blue-400 hover:text-blue-300 transition-colors"
              >
                <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                Back to Building
              </button>
              
              <div className="text-center">
                <h1 className="text-2xl font-bold">{currentLevel.title}</h1>
                <p className="text-blue-200">Subnet {currentSubnet + 1} of {scenario.requiredSubnets}</p>
              </div>
              
              <div className="bg-white/10 rounded-lg px-4 py-2">
                <div className="text-sm text-gray-300">Progress</div>
                <div className="text-lg font-bold">{currentSubnet + 1}/{scenario.requiredSubnets}</div>
              </div>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <div className="bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${((currentSubnet + 1) / scenario.requiredSubnets) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-blue-500/10 backdrop-blur-md rounded-xl p-4 border border-blue-400/30 mb-6">
                <p className="text-blue-200">
                  <span className="font-bold">Base Network:</span> {scenario.baseNetwork} | 
                  <span className="font-bold"> Task:</span> {scenario.description}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold mb-6 text-center">
                  Configure Subnet {currentSubnet + 1}
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Network Address
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 192.168.1.0"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                      autoComplete="off"
                      inputMode="decimal"
                      defaultValue={userAnswers[currentSubnet]?.networkAddress || ''}
                       onBlur={(e) => updateSubnetAnswer('networkAddress', e.target.value)}
                     />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Subnet Mask
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 255.255.255.192"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                      autoComplete="off"
                      inputMode="decimal"
                      defaultValue={userAnswers[currentSubnet]?.subnetMask || ''}
                      onBlur={(e) => updateSubnetAnswer('subnetMask', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Broadcast Address
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 192.168.1.63"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                      autoComplete="off"
                      inputMode="decimal"
                      defaultValue={userAnswers[currentSubnet]?.broadcastAddress || ''}
                      onBlur={(e) => updateSubnetAnswer('broadcastAddress', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      First Host
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 192.168.1.1"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                      autoComplete="off"
                      inputMode="decimal"
                      defaultValue={userAnswers[currentSubnet]?.firstHost || ''}
                      onBlur={(e) => updateSubnetAnswer('firstHost', e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Last Host
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 192.168.1.62"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                      autoComplete="off"
                      inputMode="decimal"
                      defaultValue={userAnswers[currentSubnet]?.lastHost || ''}
                      onBlur={(e) => updateSubnetAnswer('lastHost', e.target.value)}
                    />
                  </div>
                </div>

                {feedback.length > 0 && (
                  <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
                    <h4 className="font-bold text-yellow-300 mb-2">📋 Feedback:</h4>
                    {feedback.map((fb, index) => (
                      <div key={index} className={`flex items-center mb-1 ${
                        fb.includes('✅') ? 'text-green-300' : 'text-red-300'
                      }`}>
                        {fb.includes('✅') ? <Check className="w-4 h-4 mr-2" /> : <X className="w-4 h-4 mr-2" />}
                        {fb}
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-center mt-8">
                  <button
                    onClick={submitSubnetAnswer}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105"
                    disabled={feedback.length > 0}
                  >
                    {currentSubnet === scenario.requiredSubnets - 1 ? 'Complete Level!' : 'Submit & Continue'} 🎯
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (gameState === 'completed') {
      const passed = score >= 80;
      
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto text-center">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20">
                <div className="text-6xl mb-6">
                  {passed ? '🎊' : '📚'}
                </div>
                
                <h1 className="text-4xl font-bold mb-4">
                  {passed ? 'Congratulations!' : 'Keep Practicing!'}
                </h1>
                
                <div className="text-6xl font-black mb-4">
                  <span className={passed ? 'text-green-400' : 'text-orange-400'}>{score}%</span>
                </div>
                
                <p className="text-xl mb-8">
                  {passed ? 
                    `Amazing work! You've mastered ${currentLevel.title} and earned ${score} points!` :
                    `You scored ${score}%. You need 80% to pass, but you're getting there!`
                  }
                </p>

                {passed && (
                  <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4 mb-6">
                    <p className="text-green-300">
                      ✨ Level {currentLevel.id} Complete! 
                      {currentLevel.id < 6 ? ` Level ${currentLevel.id + 1} is now unlocked!` : ' You have completed all levels!'}
                    </p>
                  </div>
                )}

                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => {
                      setGameState('tutorial');
                      setCurrentSubnet(0);
                      setUserAnswers({});
                      setFeedback([]);
                      setScore(0);
                      const newScenario = generateLevel1Scenario();
                      setScenario(newScenario);
                    }}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition-colors"
                  >
                    Try Again
                  </button>
                  
                  <button
                    onClick={() => setCurrentView('building')}
                    className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-semibold transition-colors"
                  >
                    Back to Building
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="font-sans">
      {currentView === 'intro' && <IntroScreen />}
      {currentView === 'building' && <BuildingView />}
      {currentView === 'level' && <LevelScreen />}
    </div>
  );
};

export default SubnetMasterApp;