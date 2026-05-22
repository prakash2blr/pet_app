"use client";

import { AlertOctagon, ImageIcon, Search, Upload, Video, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { LostDogPlanCard, type LostDogPlan } from "./LostDogPlanCard";
import { VetSummaryCard, type VetSummary } from "./VetSummaryCard";

const disclaimer =
  "Pet Guardian does not provide medical diagnosis or treatment. This summary is only to help you organize information before contacting a veterinarian. For urgent symptoms, suspected poisoning, breathing difficulty, seizures, severe injury, collapse, or repeated vomiting/diarrhea, contact a veterinarian or emergency animal service immediately.";

type MediaKind = "image" | "video";

type UploadedMedia = {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  previewUrl: string;
  uploadedUrl?: string;
  kind: MediaKind;
  file?: File;
};

export function EmergencyForm({
  planId,
  initialIncidentType = "vomiting_diarrhea"
}: {
  planId: string;
  initialIncidentType?: string;
}) {
  const [incidentType, setIncidentType] = useState(initialIncidentType);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [vetSummary, setVetSummary] = useState<VetSummary | null>(null);
  const [lostDogPlan, setLostDogPlan] = useState<LostDogPlan | null>(null);
  const [loading, setLoading] = useState("");
  const [emergencyMedia, setEmergencyMedia] = useState<UploadedMedia[]>([]);
  const [lostDogMedia, setLostDogMedia] = useState<UploadedMedia[]>([]);
  const [mediaErrors, setMediaErrors] = useState({ emergency: "", lostDog: "" });
  const emergencyMediaRef = useRef<UploadedMedia[]>([]);
  const lostDogMediaRef = useRef<UploadedMedia[]>([]);
  const vetSummaryRef = useRef<HTMLDivElement>(null);
  const lostDogPlanRef = useRef<HTMLDivElement>(null);

  const set = (key: string, value: string) => setAnswers((current) => ({ ...current, [key]: value }));
  const isLostDog = incidentType === "lost_dog";

  useEffect(() => {
    emergencyMediaRef.current = emergencyMedia;
  }, [emergencyMedia]);

  useEffect(() => {
    lostDogMediaRef.current = lostDogMedia;
  }, [lostDogMedia]);

  useEffect(() => {
    return () => {
      emergencyMediaRef.current.forEach(revokeMediaUrl);
      lostDogMediaRef.current.forEach(revokeMediaUrl);
    };
  }, []);

  useEffect(() => {
    if (!vetSummary) return;
    requestAnimationFrame(() => {
      vetSummaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [vetSummary]);

  useEffect(() => {
    if (!lostDogPlan) return;
    requestAnimationFrame(() => {
      lostDogPlanRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [lostDogPlan]);

  function replaceMedia(target: "emergency" | "lostDog", files: FileList | null) {
    const current = target === "emergency" ? emergencyMedia : lostDogMedia;
    const { media, error } = buildMediaSelection(files);

    current.forEach(revokeMediaUrl);
    setMediaForTarget(target, media);
    setMediaErrors((value) => ({ ...value, [target]: error }));
  }

  function removeMedia(target: "emergency" | "lostDog", mediaId: string) {
    const current = target === "emergency" ? emergencyMedia : lostDogMedia;
    const removed = current.find((item) => item.id === mediaId);
    const next = current.filter((item) => item.id !== mediaId);

    if (removed) revokeMediaUrl(removed);
    setMediaForTarget(target, next);
    setMediaErrors((value) => ({ ...value, [target]: "" }));
  }

  function setMediaForTarget(target: "emergency" | "lostDog", media: UploadedMedia[]) {
    const answerKey = target === "emergency" ? "uploadedMedia" : "dogMedia";

    if (target === "emergency") {
      setEmergencyMedia(media);
    } else {
      setLostDogMedia(media);
    }

    setAnswers((current) => ({
      ...current,
      [answerKey]: describeMedia(media)
    }));
  }

  async function generateVetSummary() {
    setLoading("vet");
    setVetSummary(null);
    setLostDogPlan(null);

    try {
      const uploadedMedia = await uploadMedia(emergencyMedia);
      const payloadAnswers = answersWithMedia(answers, "uploadedMedia", uploadedMedia);
      setEmergencyMedia(uploadedMedia);
      setAnswers(payloadAnswers);

      const response = await fetch("/api/agent/emergency-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, incidentType, answers: payloadAnswers })
      });
      const data = await response.json();
      setVetSummary(data.summary);
    } catch (error) {
      setMediaErrors((value) => ({ ...value, emergency: getErrorMessage(error) }));
    } finally {
      setLoading("");
    }
  }

  async function generateLostDogPlan() {
    setLoading("lost");
    setVetSummary(null);
    setLostDogPlan(null);

    try {
      const uploadedMedia = await uploadMedia(lostDogMedia);
      const payloadAnswers = answersWithMedia(answers, "dogMedia", uploadedMedia);
      setLostDogMedia(uploadedMedia);
      setAnswers(payloadAnswers);

      const response = await fetch("/api/agent/lost-dog-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, answers: payloadAnswers })
      });
      const data = await response.json();
      setLostDogPlan(data.plan);
    } catch (error) {
      setMediaErrors((value) => ({ ...value, lostDog: getErrorMessage(error) }));
    } finally {
      setLoading("");
    }
  }

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{disclaimer}</div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block text-sm font-medium text-slate-700">
          Emergency type
          <select
            className="focus-ring mt-1 h-11 w-full rounded-lg border border-slate-300 px-3"
            value={incidentType}
            onChange={(event) => setIncidentType(event.target.value)}
          >
            <option value="vomiting_diarrhea">vomiting / diarrhea</option>
            <option value="injury">injury</option>
            <option value="poisoning">suspected poisoning / ingestion</option>
            <option value="breathing">breathing issue</option>
            <option value="seizure">seizure</option>
            <option value="lost_dog">lost dog</option>
            <option value="other">other</option>
          </select>
        </label>

        {isLostDog ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Last seen location" value={answers.lastSeenLocation} onChange={(v) => set("lastSeenLocation", v)} />
            <Field label="Last seen time" value={answers.lastSeenTime} onChange={(v) => set("lastSeenTime", v)} />
            <Field label="Collar/tag details" value={answers.collarTagDetails} onChange={(v) => set("collarTagDetails", v)} />
            <Field label="Microchip" value={answers.microchip} onChange={(v) => set("microchip", v)} />
            <Field label="Contact number" value={answers.contactNumber} onChange={(v) => set("contactNumber", v)} />
            <Field label="Reward" value={answers.reward} onChange={(v) => set("reward", v)} />
            <Field label="Behaviour notes" value={answers.behaviourNotes} onChange={(v) => set("behaviourNotes", v)} />
            <MediaUploadField
              label="Dog photo or video"
              media={lostDogMedia}
              error={mediaErrors.lostDog}
              onChange={(files) => replaceMedia("lostDog", files)}
              onRemove={(mediaId) => removeMedia("lostDog", mediaId)}
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="What happened" value={answers.whatHappened} onChange={(v) => set("whatHappened", v)} />
            <Field label="When it started" value={answers.whenStarted} onChange={(v) => set("whenStarted", v)} />
            <Field label="Symptoms" value={answers.symptoms} onChange={(v) => set("symptoms", v)} />
            <Field label="Food/medicine given recently" value={answers.foodMedicine} onChange={(v) => set("foodMedicine", v)} />
            <Field label="Suspected ingestion" value={answers.suspectedIngestion} onChange={(v) => set("suspectedIngestion", v)} />
            <Field label="Breathing normal yes/no" value={answers.breathingNormal} onChange={(v) => set("breathingNormal", v)} />
            <Field label="Alert yes/no" value={answers.alert} onChange={(v) => set("alert", v)} />
            <Field label="Eating/drinking yes/no" value={answers.eatingDrinking} onChange={(v) => set("eatingDrinking", v)} />
            <Field
              label="Repeated vomiting/diarrhea yes/no"
              value={answers.repeatedVomitingDiarrhea}
              onChange={(v) => set("repeatedVomitingDiarrhea", v)}
            />
            <MediaUploadField
              label="Photo or video proof"
              media={emergencyMedia}
              error={mediaErrors.emergency}
              onChange={(files) => replaceMedia("emergency", files)}
              onRemove={(mediaId) => removeMedia("emergency", mediaId)}
            />
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-clay px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={isLostDog || loading === "vet"}
            onClick={generateVetSummary}
            type="button"
          >
            <AlertOctagon size={17} />
            {loading === "vet" ? "Generating" : "Generate Vet Summary"}
          </button>
          <button
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={!isLostDog || loading === "lost"}
            onClick={generateLostDogPlan}
            type="button"
          >
            <Search size={17} />
            {loading === "lost" ? "Generating" : "Generate Lost Dog Action Plan"}
          </button>
        </div>
      </div>

      {vetSummary ? (
        <div ref={vetSummaryRef} className="scroll-mt-6">
          <VetSummaryCard summary={vetSummary} media={emergencyMedia} />
        </div>
      ) : null}
      {lostDogPlan ? (
        <div ref={lostDogPlanRef} className="scroll-mt-6">
          <LostDogPlanCard plan={lostDogPlan} media={lostDogMedia} />
        </div>
      ) : null}
    </section>
  );
}

function buildMediaSelection(files: FileList | null) {
  const selectedFiles = Array.from(files ?? []);
  const allowedFiles = selectedFiles.filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/"));
  const invalidCount = selectedFiles.length - allowedFiles.length;
  const videos = allowedFiles.filter((file) => file.type.startsWith("video/"));
  const images = allowedFiles.filter((file) => file.type.startsWith("image/"));
  const selected = videos.length > 0 ? videos.slice(0, 1) : images.slice(0, 4);
  const messages: string[] = [];

  if (invalidCount > 0) messages.push("Only image and video files are allowed.");
  if (videos.length > 0 && (videos.length > 1 || images.length > 0)) {
    messages.push("Only one video can be uploaded. Images and extra videos were skipped.");
  }
  if (videos.length === 0 && images.length > 4) messages.push("Only the first 4 images were uploaded.");

  return {
    media: selected.map((file, index) => ({
      id: makeMediaId(file, index),
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
      previewUrl: "",
      kind: file.type.startsWith("video/") ? ("video" as const) : ("image" as const),
      file
    })).map((item) => ({ ...item, previewUrl: item.url })),
    error: messages.join(" ")
  };
}

function makeMediaId(file: File, index: number) {
  const randomId = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${index}`;
  return `${file.name}-${file.lastModified}-${randomId}`;
}

function describeMedia(media: UploadedMedia[]) {
  if (!media.length) return "";

  const firstKind = media[0]?.kind;
  const countLabel = firstKind === "video" ? "1 video" : `${media.length} image${media.length === 1 ? "" : "s"}`;
  const names = media.map((item) => item.name).join(", ");
  return `${countLabel} uploaded: ${names}`;
}

function answersWithMedia(answers: Record<string, string>, answerKey: "uploadedMedia" | "dogMedia", media: UploadedMedia[]) {
  return {
    ...answers,
    [answerKey]: describeMedia(media),
    [`${answerKey}Urls`]: media.map((item) => item.uploadedUrl || item.url).join(", ")
  };
}

async function uploadMedia(media: UploadedMedia[]) {
  const mediaToUpload = media.filter((item) => item.file);

  if (!mediaToUpload.length) return media;

  const formData = new FormData();
  mediaToUpload.forEach((item) => {
    if (item.file) formData.append("files", item.file);
  });

  const response = await fetch("/api/uploads", {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "Upload failed. Please try again.");
  }

  const data = (await response.json()) as {
    files: Array<{ name: string; type: string; size: number; url: string; kind: MediaKind }>;
  };
  let uploadedIndex = 0;

  return media.map((item) => {
    if (!item.file) return item;

    const uploaded = data.files[uploadedIndex++];

    return {
      ...item,
      name: uploaded.name || item.name,
      type: uploaded.type || item.type,
      size: uploaded.size || item.size,
      url: item.previewUrl || item.url,
      uploadedUrl: uploaded.url,
      kind: uploaded.kind,
      file: undefined
    };
  });
}

function revokeMediaUrl(media: UploadedMedia) {
  if (media.previewUrl.startsWith("blob:")) URL.revokeObjectURL(media.previewUrl);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

function MediaUploadField({
  label,
  media,
  error,
  onChange,
  onRemove
}: {
  label: string;
  media: UploadedMedia[];
  error?: string;
  onChange: (files: FileList | null) => void;
  onRemove: (mediaId: string) => void;
}) {
  const inputId = useId();

  return (
    <div className="sm:col-span-2">
      <label className="block text-sm font-medium text-slate-700" htmlFor={inputId}>
        {label}
      </label>
      <label
        className="focus-ring mt-1 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center"
        htmlFor={inputId}
      >
        <Upload className="text-slate-500" size={24} />
        <span className="mt-2 text-sm font-semibold text-ink">Choose files</span>
        <span className="mt-1 text-xs text-slate-500">Upload up to 4 images or 1 video</span>
        <input
          id={inputId}
          className="sr-only"
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={(event) => {
            onChange(event.currentTarget.files);
            event.currentTarget.value = "";
          }}
        />
      </label>
      {error ? <p className="mt-2 text-xs font-medium text-amber-700">{error}</p> : null}
      {media.length ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {media.map((item) => (
            <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  {item.kind === "video" ? <Video size={16} className="shrink-0 text-slate-500" /> : <ImageIcon size={16} className="shrink-0 text-slate-500" />}
                  <span className="truncate text-sm font-medium text-ink">{item.name}</span>
                </div>
                <button
                  className="focus-ring rounded-full p-1 text-slate-500 hover:bg-slate-100"
                  type="button"
                  onClick={() => onRemove(item.id)}
                  aria-label={`Remove ${item.name}`}
                >
                  <X size={15} />
                </button>
              </div>
              {item.kind === "video" ? (
                <video className="mt-3 h-40 w-full rounded-lg bg-black object-contain" src={item.url} controls />
              ) : (
                <img className="mt-3 h-40 w-full rounded-lg bg-slate-100 object-contain" src={item.url} alt={item.name} />
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value = "",
  onChange
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        className="focus-ring mt-1 h-11 w-full rounded-lg border border-slate-300 px-3"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
