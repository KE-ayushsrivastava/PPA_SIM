import { createContext, useState, useEffect, useContext, useRef } from "react";
import { AuthContext } from "./AuthContext.jsx"; // 👈 import AuthContext to get user

export const ScenarioContext = createContext();

export const ScenarioProvider = ({ children }) => {
  const { user } = useContext(AuthContext); // 👈 fetch user from AuthContext

  const [loadScenarios, setLoadScenarios] = useState([]);
  const [deletedScenarios, setDeletedScenarios] = useState([]);
  const [selectedLoadScenario, setSelectedLoadScenario] = useState("");
  const [selectedDeletedScenario, setSelectedDeletedScenario] = useState("");
  const [selectedScenario1, setSelectedScenario1] = useState("");
  const [selectedScenario2, setSelectedScenario2] = useState("");

  const [resultComparisonData, setResultComparisonData] = useState({
    detail1: null,
    detail2: null,
    result1: null,
    result2: null,
  });

  // 🔹 New additions for Result Comparison
  const scenarioCacheRef = useRef({}); // cache for scenario details
  const [loadingScenarioDetail, setLoadingScenarioDetail] = useState(false);
  const [errorScenarioDetail, setErrorScenarioDetail] = useState(null);

  // ✅ Fetch active & deleted scenarios when user logs in (SOP)
  useEffect(() => {
    if (user && user.username) {
      // Active
      fetch(`/api/fetch-scenarios?user_id=${user.username}&is_deleted=0`)
        .then((res) => res.json())
        .then((data) => setLoadScenarios(data))
        .catch((err) => console.error("Error loading scenarios:", err));

      // Deleted
      fetch(`/api/fetch-scenarios?user_id=${user.username}&is_deleted=1`)
        .then((res) => res.json())
        .then((data) => setDeletedScenarios(data))
        .catch((err) => console.error("Error loading deleted scenarios:", err));
    }
  }, [user]);

  // 🧠 New function: fetch full scenario detail by ID (with caching)
  const fetchScenarioById = async (id, { force = false, signal } = {}) => {
    if (!id) return null;

    // Return from cache if exists and not forced
    if (scenarioCacheRef.current[id] && !force) {
      return scenarioCacheRef.current[id];
    }

    try {
      setLoadingScenarioDetail(true);
      setErrorScenarioDetail(null);
      const res = await fetch(`/api/scenarios/${id}`, { signal });
      if (!res.ok) {
        throw new Error(`Failed to fetch scenario: ${res.status}`);
      }

      const data = await res.json();
      scenarioCacheRef.current[id] = data; // store in cache
      setLoadingScenarioDetail(false);
      return data;
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("fetchScenarioById error:", err);
      setErrorScenarioDetail(err.message || "Failed to load scenario");
      setLoadingScenarioDetail(false);
      throw err;
    }
  };

  // 🧹 Optional helper: clear cache for a specific scenario or all
  const invalidateScenarioCache = (id) => {
    if (id) delete scenarioCacheRef.current[id];
    else scenarioCacheRef.current = {};
  };

  return (
    <ScenarioContext.Provider
      value={{
        // 🔹 Existing SOP states
        loadScenarios,
        setLoadScenarios,
        deletedScenarios,
        setDeletedScenarios,
        selectedLoadScenario,
        setSelectedLoadScenario,
        selectedDeletedScenario,
        setSelectedDeletedScenario,
        selectedScenario1,
        setSelectedScenario1,
        selectedScenario2,
        setSelectedScenario2,
        resultComparisonData,
        setResultComparisonData,

        // 🔹 New additions for Result Comparison
        fetchScenarioById,
        invalidateScenarioCache,
        loadingScenarioDetail,
        errorScenarioDetail,
        scenarioCache: scenarioCacheRef.current,
      }}
    >
      {children}
    </ScenarioContext.Provider>
  );
};

export const useScenario = () => useContext(ScenarioContext);
