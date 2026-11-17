import { useState, useEffect } from 'react';
import { apiService } from '../services/api.service';
import { HealthStatus } from '../models/api.model';

export function useHealthViewModel() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  const check = async () => {
    setIsChecking(true);
    try {
      const data = await apiService.checkHealth();
      setHealth(data);
      setIsHealthy(data.status === 'ok');
    } catch {
      setIsHealthy(false);
      setHealth(null);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    health,
    isHealthy,
    isChecking,
    recheckHealth: check,
  };
}
