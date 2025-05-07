import { useState, useEffect, useCallback, useRef } from 'react';
import LayercodeClient from '@layercode/js-sdk';

/**
 * Configuration options for the useLayercodePipeline hook.
 */
interface UseLayercodePipelineOptions {
  pipelineId: string;
  sessionId?: string;
  authorizeSessionEndpoint: string;
  metadata?: Record<string, any>;
  onConnect?: ({ sessionId }: { sessionId: string | null }) => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onDataMessage?: (data: any) => void;
}

/**
 * Hook for connecting to a Layercode pipeline in a React application
 *
 * @param options - Configuration options for the pipeline
 * @returns An object containing methods and state for interacting with the pipeline
 */
const useLayercodePipeline = (
  // Accept the public options plus any other properties (for internal use)
  options: UseLayercodePipelineOptions & Record<string, any>
) => {
  // Extract public options
  const { pipelineId, sessionId, authorizeSessionEndpoint, metadata = {}, onConnect, onDisconnect, onError, onDataMessage } = options;

  const [status, setStatus] = useState('initializing');
  const [userAudioAmplitude, setUserAudioAmplitude] = useState(0);
  const [agentAudioAmplitude, setAgentAudioAmplitude] = useState(0);
  // Reference to the LayercodeClient instance
  const clientRef = useRef<LayercodeClient | null>(null);

  // Initialize the client on component mount
  useEffect(() => {
    // Create a new LayercodeClient instance
    console.log('Creating LayercodeClient instance');
    clientRef.current = new LayercodeClient({
      pipelineId,
      sessionId,
      authorizeSessionEndpoint,
      metadata,
      onConnect: ({ sessionId }: { sessionId: string | null }) => {
        onConnect?.({ sessionId });
      },
      onDisconnect: () => {
        onDisconnect?.();
      },
      onError: (error: Error) => {
        onError?.(error);
      },
      onDataMessage: (data: any) => {
        onDataMessage?.(data);
      },
      onStatusChange: (newStatus: string) => {
        setStatus(newStatus);
      },
      onUserAmplitudeChange: (amplitude: number) => {
        setUserAudioAmplitude(amplitude);
      },
      onAgentAmplitudeChange: (amplitude: number) => {
        setAgentAudioAmplitude(amplitude);
      },
    });

    // Pass the override websocket URL if provided. Use for local development.
    if (options['_websocketUrl']) {
      clientRef.current._websocketUrl = options['_websocketUrl'];
    }

    // Connect to the pipeline
    clientRef.current.connect().catch((error: Error) => {
      console.error('Failed to connect to pipeline:', error);
      onError?.(error);
    });

    // Cleanup function to disconnect when component unmounts
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
    };
    // Add the internal override URL to the dependency array
  }, [pipelineId, sessionId, authorizeSessionEndpoint]); // Make sure metadata isn't causing unnecessary re-renders if it changes often

  // Class methods
  // TODO: Mic mute
  // const setMuteMic = useCallback((mute: boolean) => {
  //   // clientRef.current?.setMuteMic(mute);
  // }, []);
  const triggerUserTurnStarted = useCallback(() => {
    clientRef.current?.triggerUserTurnStarted();
  }, []);
  const triggerUserTurnFinished = useCallback(() => {
    clientRef.current?.triggerUserTurnFinished();
  }, []);

  // Return methods and state
  return {
    // Methods
    triggerUserTurnStarted,
    triggerUserTurnFinished,

    // State
    status,
    userAudioAmplitude,
    agentAudioAmplitude,
  };
};

export { useLayercodePipeline, UseLayercodePipelineOptions }; // Export the type too
