import React, { ReactNode, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { listAssetBeds } from "../../../Redux/actions";
import { AssetData } from "../../Assets/AssetTypes";
import { PatientModel } from "../../Patient/models";
import Waveform, { WaveformType } from "./Waveform";

export interface ITeleICUPatientVitalsCardProps {
  patient: PatientModel;
}

const getVital = (
  patientObservations: any,
  vital: string,
  fallbackValue?: any
) => {
  if (patientObservations) {
    const vitalValues = patientObservations[vital];
    if (vitalValues) {
      const returnValue = vitalValues?.value;

      if (returnValue !== undefined && returnValue !== null) {
        return returnValue;
      }
    }
  }
  if (fallbackValue) {
    return fallbackValue;
  }
  return "";
};

export default function TeleICUPatientVitalsCard({
  patient,
}: ITeleICUPatientVitalsCardProps) {
  const wsClient = useRef<WebSocket>();

  const [waveforms, setWaveForms] = useState<WaveformType[] | null>(null);

  const dispatch: any = useDispatch();
  const [hl7Asset, setHl7Asset] = React.useState<AssetData>();
  const [patientObservations, setPatientObservations] = React.useState<any>();

  const fetchData = async () => {
    if (patient?.last_consultation?.current_bed?.bed_object?.id) {
      let bedAssets = await dispatch(
        listAssetBeds({
          bed: patient.last_consultation?.current_bed?.bed_object?.id,
        })
      );
      bedAssets = {
        ...bedAssets,
        data: {
          ...bedAssets.data,
          results: bedAssets.data.results.filter((assetBed: any) =>
            assetBed.asset_object.meta?.asset_type === "HL7MONITOR"
              ? true
              : false
          ),
        },
      };
      if (bedAssets.data.results.length > 0) {
        setHl7Asset(bedAssets.data.results[0].asset_object);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [patient]);

  const connectWs = (url: string) => {
    wsClient.current = new WebSocket(url);
    wsClient.current.addEventListener("message", (e) => {
      const newObservations = JSON.parse(e.data || "{}");
      if (newObservations.length > 0) {
        setWaveForms(
          newObservations.filter((o: any) => o.observation_id === "waveform")
        );
        const newObservationsMap = newObservations.reduce(
          (acc: any, curr: { observation_id: any }) => ({
            ...acc,
            [curr.observation_id]: curr,
          }),
          {}
        );
        setPatientObservations(newObservationsMap);
      }
    });
  };

  useEffect(() => {
    const url = hl7Asset?.meta?.local_ip_address
      ? `wss://${hl7Asset?.meta?.middleware_hostname}/observations/${hl7Asset?.meta?.local_ip_address}`
      : null;

    if (url) connectWs(url);

    return () => {
      wsClient.current?.close();
    };
  }, [hl7Asset?.meta?.local_ip_address, hl7Asset?.meta?.middleware_hostname]);

  useEffect(() => {
    return () => {
      wsClient.current?.close();
    };
  }, []);

  type VitalType = {
    label: ReactNode;
    liveKey:string;
    vitalKey:string;
    waveformKey?:string;
    waveformColor?:string;
  }

  /*const vitals: [ReactNode, string, string | null, string | null][] = [
    [<>Pulse Rate</>, "pulse-rate", "pulse", "pleth"],
    [<>Blood Pressure</>, "bp", "bp", "II"],
    [
      <>
        SpO<sub>2</sub>
      </>,
      "SpO2",
      "ventilator_spo2",
    ],
    [<>R. Rate</>, "respiratory-rate", "resp", "respiration"],
    [<>Temperature (F)</>, "body-temperature1", "temperature"],
  ];*/

  const vitals: VitalType[] = [
    {
      label: <>Pulse Rate</>,
      liveKey: "pulse-rate",
      vitalKey: "pulse",
      waveformKey: "Pleth",
      waveformColor: "red",
    },
    {
      label: <>Blood Pressure</>,
      liveKey: "bp",
      vitalKey: "bp",
      waveformKey: "II",
      waveformColor: "blue",
    },
    {
      label: (
        <>
          SpO<sub>2</sub>
        </>
      ),
      liveKey: "SpO2",
      vitalKey: "ventilator_spo2",
    },
    {
      label: <>R. Rate</>,
      liveKey: "respiratory-rate",
      vitalKey: "resp",
      waveformKey: "Respiration",
      waveformColor: "green",
    },
    {
      label: <>Temperature (F)</>,
      liveKey: "body-temperature1",
      vitalKey: "temperature",
    },
  ];

  return (
    <div className=" w-full">
      <div className="flex w-full items-stretch flex-col md:flex-row">
        <div className="w-full flex flex-col items-stretch py-2 bg-black h-auto text-gray-400">
          {waveforms ? (
            <>
              {vitals.map((v, i) => {
                const waveform = waveforms.filter(w=>w["wave-name"] === v.waveformKey)[0];
                return (
                  (v.waveformKey && waveform) ?
                    <Waveform
                      key={i}
                      wave={waveform}
                      title={v.waveformKey}
                      color={v.waveformColor}
                    /> : (<div className="h-[90px] flex items-center justify-center text-gray-900">
                      No data
                    </div>)
                )
              })}
            </>
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <div className="text-center w-[150px] text-gray-800">
                <i className="fas fa-plug-circle-exclamation text-4xl mb-4" />
                <div>No Live data at the moment!</div>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-row md:flex-col flex-wrap md:flex-nowrap w-full md:w-[200px] border-l border-l-gray-400 p-3 justify-between md:justify-start shrink-0">
          {vitals.map((vital, i) => {
            const liveReading = getVital(patientObservations, vital.liveKey);
            return (
              <div key={i} className="p-2 h-[90px]">
                <h2 className="font-bold text-xl md:text-3xl">
                  {liveReading ||
                    (vital.vitalKey === "bp"
                      ? `${
                          patient.last_consultation?.last_daily_round?.bp
                            .systolic || "--"
                        }/${
                          patient.last_consultation?.last_daily_round?.bp
                            .diastolic || "--"
                        }`
                      : patient.last_consultation?.last_daily_round?.[
                          vital.vitalKey || ""
                        ]) ||
                    "--"}
                </h2>
                <div className="text-xs md:text-base">
                  <i
                    className={`fas fa-circle text-xs mr-2 ${
                      liveReading ? "text-green-600" : "text-gray-400"
                    }`}
                  />
                  {vital.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
