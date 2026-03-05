import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { 
  Vote, 
  LogOut, 
  Calendar, 
  MapPin, 
  Users, 
  CheckCircle2, 
  X,
  Loader2,
  Building2,
  Stamp,
  AlertTriangle, 
  Ban,
  ArrowLeft,
  Fingerprint
} from "lucide-react";

// ✅ CONFIGURATION
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`; 
const IMG_PLACEHOLDER_SVG = "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png";

const VotePage = ({ epicId, setEpicId }) => {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal & Voting States
  const [selectedElection, setSelectedElection] = useState(null);
  
  // Statuses: 'checking', 'eligible', 'not_voted', 'confirming', 'already_voted', 'ineligible'
  const [votingStatus, setVotingStatus] = useState(null); 
  const [eligibilityMessage, setEligibilityMessage] = useState(""); 
  const [selectedCandidate, setSelectedCandidate] = useState(null); // Stores Candidate Name
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!epicId) {
      navigate("/");
    }
  }, [epicId, navigate]);

  useEffect(() => {
    const fetchElections = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/election/all`);
        setElections(res.data.elections || []);
      } catch (err) {
        setError("Failed to fetch elections");
      } finally {
        setLoading(false);
      }
    };
    fetchElections();
  }, []);

const isToday = (dateStr) => {
  if (!dateStr) return false;

  const localToday = new Date().toLocaleDateString("en-CA"); 
  let formattedElectionDate;

  if (dateStr.includes("/")) {
    const d = new Date(dateStr);
    formattedElectionDate = d.toLocaleDateString("en-CA");
  } else {
    formattedElectionDate = dateStr.split("T")[0];
  }

  return localToday === formattedElectionDate;
};

  const getCandidateImage = (candidate) => {
    const path = candidate.photo_url || candidate.symbol_url;
    if (!path) return IMG_PLACEHOLDER_SVG;
    if (path.startsWith("http") || path.startsWith("https")) return path;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${API_BASE_URL}${cleanPath}`;
  };

  const handleCheckVote = async () => {
    try {
      setVotingStatus("checking");
      setEligibilityMessage("");

      const res = await axios.get(
        `${API_BASE_URL}/api/vote/check/${selectedElection._id}/${epicId}`
      );

      setVotingStatus(res.data.status);
      
      if (res.data.status === "already_voted") {
        toast.info("You have already voted in this election.");
      } else {
        toast.success("You are eligible to vote.");
      }

    } catch (err) {
      console.error(err);
      if (err.response && (err.response.status === 403 || err.response.status === 404)) {
        setVotingStatus("ineligible");
        setEligibilityMessage(err.response.data.detail || "You are not eligible to vote in this election.");
      } else {
        toast.error("Error checking vote eligibility.");
        setVotingStatus(null);
      }
    }
  };

  // Step 1: Move to Confirmation Screen
  const handleInitiateVote = () => {
    if (!selectedCandidate) {
      toast.error("Please select a candidate before voting.");
      return;
    }
    setVotingStatus("confirming");
  };

  // Step 2: Actually API Call
  const handleFinalCastVote = async () => {
    setIsSubmitting(true);
    try {
      const voteData = {
        election_id: selectedElection._id,
        epic_id: epicId,
        candidate_name: selectedCandidate,
        transaction_id: "txn-" + Math.random().toString(36).substr(2, 9),
      };

      const res = await axios.post(`${API_BASE_URL}/api/vote/cast`, voteData);
      toast.success(res.data.message);
      setVotingStatus("already_voted");
    } catch (err) {
      console.error(err);
      toast.error("Error casting vote: " + (err.response?.data?.detail || "Unknown error"));
      // If error, go back to list to retry or see error
      setVotingStatus("not_voted"); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeElectionModal = () => {
    setSelectedElection(null);
    setSelectedCandidate(null);
    setVotingStatus(null);
    setEligibilityMessage("");
  };

  const handleLogout = () => {
    setEpicId("");
    navigate("/");
  };

  const handlePhotoError = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = IMG_PLACEHOLDER_SVG;
  };

  // Helper to get full candidate object for confirmation screen
  const getSelectedCandidateDetails = () => {
    if (!selectedElection || !selectedCandidate) return null;
    return selectedElection.candidates.find(c => c.name === selectedCandidate);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-lg">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <div className="p-3 bg-blue-600 rounded-xl">
              <Vote className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Election Portal
              </h2>
              <p className="text-sm text-gray-400">You can only vote for elections held today!!</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-slate-800/50 rounded-lg border border-white/10 text-sm">
              <span className="text-gray-400 mr-2">EPIC ID:</span>
              <span className="font-mono font-semibold text-blue-400">{epicId}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 border border-red-500/20 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </header>

        {/* ELECTION LIST */}
        {loading && <div className="flex justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>}
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {elections.map((election) => {
            const open = isToday(election.election_date);
            return (
              <div key={election._id} className="group bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-all duration-300 hover:shadow-xl">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-purple-500/20 rounded-lg text-purple-300">
                    <Building2 className="w-6 h-6" />
                  </div>
                  {open ? (
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/20 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      LIVE
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-500/20 text-gray-400 text-xs font-bold rounded-full border border-gray-500/20">
                      CLOSED
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{election.election_type}</h3>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-gray-400 text-sm"><MapPin className="w-4 h-4 mr-2 text-blue-400" />{election.district}, {election.state}</div>
                  <div className="flex items-center text-gray-400 text-sm"><Calendar className="w-4 h-4 mr-2 text-purple-400" />{election.election_date}</div>
                </div>

                <button
                  onClick={() => setSelectedElection(election)}
                  disabled={!open}
                  className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2
                    ${open ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg' : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'}`}
                >
                  {open ? 'Vote Now' : 'Voting Closed'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🗳️ VOTING MODAL */}
      {selectedElection && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeElectionModal}></div>
          
          <div className="bg-slate-900 border border-white/10 w-full max-w-xl rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {votingStatus === 'confirming' ? 'Confirm Vote' : 'Cast Your Vote'}
                </h3>
                <p className="text-sm text-gray-400">
                  {selectedElection.election_type} • {selectedElection.district}
                </p>
              </div>
              <button onClick={closeElectionModal} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              
              {/* 1. CHECK ELIGIBILITY */}
              {votingStatus !== "ineligible" && votingStatus !== "already_voted" && votingStatus !== "confirming" && (
                <div className="mb-6 bg-blue-900/20 p-4 rounded-xl border border-blue-500/20">
                  <label className="block text-sm font-medium text-blue-300 mb-2">Verify Identity</label>
                  <div className="flex gap-3">
                    <input type="text" value={epicId} readOnly className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-gray-300" />
                    <button
                      onClick={handleCheckVote}
                      disabled={votingStatus === "checking" || votingStatus === "not_voted"}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                      {votingStatus === "checking" ? <Loader2 className="w-5 h-5 animate-spin" /> : "Check Eligibility"}
                    </button>
                  </div>
                </div>
              )}

              {/* 2. INELIGIBLE MESSAGE */}
              {votingStatus === "ineligible" && (
                <div className="text-center py-8 px-4 bg-red-500/10 rounded-xl border border-red-500/30">
                  <Ban className="w-8 h-8 text-red-400 mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-red-400 mb-2">Not Eligible</h4>
                  <p className="text-gray-300">{eligibilityMessage}</p>
                </div>
              )}

              {/* 3. SELECT CANDIDATE (List) */}
              {votingStatus === "not_voted" && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Select Candidate</h4>
                  <div className="grid gap-3">
                    {selectedElection.candidates.map((c, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedCandidate(c.name)}
                        className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all group
                          ${selectedCandidate === c.name ? "bg-blue-600/20 border-blue-500" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
                      >
                        <img src={getCandidateImage(c)} alt={c.name} onError={handlePhotoError} className="w-14 h-14 object-cover rounded-full border-2 border-white/20 bg-slate-800" />
                        <div className="ml-4 flex-1">
                          <p className={`font-bold text-lg ${selectedCandidate === c.name ? "text-blue-300" : "text-white"}`}>{c.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-400">{c.party}</span>
                            <div className="h-4 w-[1px] bg-white/20"></div>
                            <span className="flex items-center gap-1 text-purple-200 text-xs"><Stamp className="w-3 h-3" />{c.symbol}</span>
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedCandidate === c.name ? "border-blue-500 bg-blue-500" : "border-gray-600"}`}>
                          {selectedCandidate === c.name && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. CONFIRMATION SCREEN (New) */}
              {votingStatus === "confirming" && getSelectedCandidateDetails() && (
                <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
                  
                  {/* Warning Banner */}
                  <div className="w-full bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-6 flex items-center justify-center gap-2 text-yellow-400 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    This action cannot be undone once vote is stored in blockchain!!
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full"></div>
                    <img 
                      src={getCandidateImage(getSelectedCandidateDetails())} 
                      alt="Selected" 
                      onError={handlePhotoError}
                      className="w-32 h-32 rounded-full border-4 border-blue-500 shadow-2xl object-cover relative z-10 bg-slate-800"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-blue-600 rounded-full p-2 border-4 border-slate-900 z-20">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-white mt-4">{getSelectedCandidateDetails().name}</h2>
                  
                  <div className="flex items-center gap-3 mt-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                    <span className="font-semibold text-blue-300">{getSelectedCandidateDetails().party}</span>
                    <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                    <span className="text-gray-400 text-sm flex items-center gap-1">
                      <Stamp className="w-3 h-3" /> {getSelectedCandidateDetails().symbol}
                    </span>
                  </div>

                  <div className="mt-8 w-full p-4 bg-slate-800 rounded-xl border border-white/5">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Voter ID</span>
                      <span className="font-mono text-white">{epicId}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Constituency</span>
                      <span className="text-white">{selectedElection.district}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. SUCCESS MESSAGE */}
              {votingStatus === "already_voted" && (
                <div className="text-center py-8 animate-in fade-in slide-in-from-bottom-4">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Fingerprint className="w-10 h-10 text-green-400" />
                  </div>
                  <h4 className="text-2xl font-bold text-white mb-2">Vote Recorded!</h4>
                  <p className="text-gray-400">Your vote has been securely cast on the blockchain.</p>
                  <div className="mt-6 p-3 bg-white/5 rounded-lg text-xs text-gray-500 font-mono break-all">
                    TXN: {Math.random().toString(36).substr(2, 16).toUpperCase()}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-white/10 bg-white/5">
              
              {/* Button: Proceed to Confirmation */}
              {votingStatus === "not_voted" && (
                <button
                  onClick={handleInitiateVote}
                  disabled={!selectedCandidate}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Proceed to Vote
                </button>
              )}

              {/* Buttons: Confirm or Back */}
              {votingStatus === "confirming" && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setVotingStatus("not_voted")}
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  
                  <button
                    onClick={handleFinalCastVote}
                    disabled={isSubmitting}
                    className="flex-[2] py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-green-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>
                        <Fingerprint className="w-5 h-5" />
                        Confirm & Vote
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Close Button */}
              {(votingStatus === "ineligible" || votingStatus === "already_voted") && (
                 <button onClick={closeElectionModal} className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all">
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VotePage;