import { useCallback, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";

import styles from "./TeacherUploadLecturePage.module.css";

const INITIAL_FORM = {
  title: "",
  description: "",
  thumbnailUrl: "",
  resourceUrl: "",
  durationMinutes: "",
  subject: "",
  exam: "GENERAL",
  language: "EN",
  tags: "",
};

const TeacherUploadLecturePage = () => {
  const outletContext = useOutletContext() ?? {};
  const {
    handleLectureSubmit,
    lecturesLoading,
    handleLectureCreated,
    lectureUploadRef,
  } = outletContext;

  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const fileInputRef = useRef(null);

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(INITIAL_FORM),
    [form]
  );

  const handleChange = useCallback((event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
  }, []);

  const handleTagsChange = useCallback((event) => {
    setForm((prev) => ({ ...prev, tags: event.target.value }));
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setError(null);
      setSuccess(null);

      if (!form.title.trim() || !form.resourceUrl.trim()) {
        setError("Title and resource URL are required.");
        return;
      }

      setSubmitting(true);
      const payload = {
        ...form,
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      const result = await handleLectureSubmit?.(payload);
      setSubmitting(false);

      if (!result?.success) {
        setError(result?.error || "Failed to upload lecture");
        return;
      }

      setSuccess("Lecture uploaded successfully.");
      setForm(INITIAL_FORM);
      handleLectureCreated?.(result.lecture);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [form, handleLectureSubmit, handleLectureCreated]
  );

  const handleReset = useCallback(() => {
    setForm(INITIAL_FORM);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Upload lecture</p>
          <h1 className={styles.title}>Share a new lecture</h1>
          <p className={styles.subtitle}>
            Provide the essential details so students can discover and download
            your lecture.
          </p>
        </div>
      </header>

      <form
        className={styles.form}
        onSubmit={handleSubmit}
        ref={lectureUploadRef}
      >
        <div className={styles.formLayout}>
          <div className={styles.formMain}>
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionBadge}>Basics</span>
                <div>
                  <h2>Lecture basics</h2>
                  <p>Set the context and share what learners can expect.</p>
                </div>
              </div>

              <div className={styles.sectionGrid}>
                <label className={styles.field}>
                  <span>Lecture title *</span>
                  <input
                    name="title"
                    type="text"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. Rotational Dynamics Masterclass"
                    required
                    disabled={submitting}
                  />
                </label>

                <label className={`${styles.field} ${styles.fullWidth}`}>
                  <span>Short description</span>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Key outcomes, required materials, or highlights."
                    disabled={submitting}
                  />
                  <small>{form.description.length || 0} / 400 characters</small>
                </label>
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionBadge}>Media</span>
                <div>
                  <h2>Learning assets</h2>
                  <p>Add the resources students will download or stream.</p>
                </div>
              </div>

              <div className={styles.sectionGrid}>
                <label className={styles.field}>
                  <span>Resource URL *</span>
                  <input
                    name="resourceUrl"
                    type="url"
                    value={form.resourceUrl}
                    onChange={handleChange}
                    placeholder="https://cdn.neuralstudy.in/lectures/..."
                    required
                    disabled={submitting}
                  />
                  <small>
                    Direct link to video/PDF/zip. Ensure it is accessible to
                    students.
                  </small>
                </label>

                <label className={styles.field}>
                  <span>Thumbnail URL</span>
                  <input
                    name="thumbnailUrl"
                    type="url"
                    value={form.thumbnailUrl}
                    onChange={handleChange}
                    placeholder="https://cdn.neuralstudy.in/thumbnails/..."
                    disabled={submitting}
                  />
                </label>

                <label className={styles.field}>
                  <span>Duration (minutes)</span>
                  <input
                    name="durationMinutes"
                    type="number"
                    min="0"
                    step="1"
                    value={form.durationMinutes}
                    onChange={handleChange}
                    placeholder="45"
                    disabled={submitting}
                  />
                </label>
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionBadge}>Metadata</span>
                <div>
                  <h2>Discovery details</h2>
                  <p>Tag your lecture so students can find it quickly.</p>
                </div>
              </div>

              <div className={styles.sectionGrid}>
                <label className={styles.field}>
                  <span>Subject/topic</span>
                  <input
                    name="subject"
                    type="text"
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="Physics — Mechanics"
                    disabled={submitting}
                  />
                </label>

                <label className={styles.field}>
                  <span>Exam</span>
                  <select
                    name="exam"
                    value={form.exam}
                    onChange={handleChange}
                    disabled={submitting}
                  >
                    <option value="GENERAL">General</option>
                    <option value="JEE">JEE</option>
                    <option value="NEET">NEET</option>
                    <option value="APTITUDE">Aptitude</option>
                  </select>
                </label>

                <label className={styles.field}>
                  <span>Language</span>
                  <select
                    name="language"
                    value={form.language}
                    onChange={handleChange}
                    disabled={submitting}
                  >
                    <option value="EN">English</option>
                    <option value="HI">Hindi</option>
                    <option value="BI">Bilingual</option>
                  </select>
                </label>

                <label className={`${styles.field} ${styles.fullWidth}`}>
                  <div className={styles.fieldLabelRow}>
                    <span>Tags (comma separated)</span>
                    <span className={styles.counterBadge}>
                      {form.tags
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean).length || 0}{" "}
                      tags
                    </span>
                  </div>
                  <input
                    name="tags"
                    type="text"
                    value={form.tags}
                    onChange={handleTagsChange}
                    placeholder="thermodynamics, jee, live session"
                    disabled={submitting}
                  />
                </label>
              </div>
            </section>
          </div>

          <aside className={styles.guidePanel}>
            <div className={styles.guideCard}>
              <h3>Publishing checklist</h3>
              <ul className={styles.guideList}>
                <li>Use shareable links that do not require login.</li>
                <li>Pick a thumbnail that is 16:9 and under 1&nbsp;MB.</li>
                <li>Mention prerequisites or materials in the description.</li>
                <li>Add 3–5 tags to improve search relevance.</li>
              </ul>
            </div>

            <div className={styles.previewCard}>
              <span className={styles.previewLabel}>Live preview</span>
              <div className={styles.previewBody}>
                <div className={styles.previewThumbnail}>
                  {form.thumbnailUrl ? (
                    <img
                      src={form.thumbnailUrl}
                      alt="Lecture thumbnail preview"
                    />
                  ) : (
                    <span>Thumbnail preview</span>
                  )}
                </div>
                <h4>{form.title || "Lecture title"}</h4>
                <p>
                  {form.description ||
                    "A concise summary will appear here for students."}
                </p>
                <div className={styles.previewMeta}>
                  {form.durationMinutes ? (
                    <span>{form.durationMinutes} mins</span>
                  ) : null}
                  {form.subject ? <span>{form.subject}</span> : null}
                  <span>
                    {form.language === "HI"
                      ? "Hindi"
                      : form.language === "BI"
                      ? "Bilingual"
                      : "English"}
                  </span>
                </div>
                {form.tags ? (
                  <div className={styles.previewTags}>
                    {form.tags
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter(Boolean)
                      .slice(0, 5)
                      .map((tag) => (
                        <span key={tag}>#{tag}</span>
                      ))}
                  </div>
                ) : null}
              </div>
            </div>
          </aside>
        </div>

        {error ? <div className={styles.error}>{error}</div> : null}
        {success ? <div className={styles.success}>{success}</div> : null}

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={submitting}
          >
            {submitting ? "Uploading…" : "Upload lecture"}
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={handleReset}
            disabled={submitting || (!isDirty && !error && !success)}
          >
            Reset form
          </button>
        </div>
      </form>
    </section>
  );
};

export default TeacherUploadLecturePage;
