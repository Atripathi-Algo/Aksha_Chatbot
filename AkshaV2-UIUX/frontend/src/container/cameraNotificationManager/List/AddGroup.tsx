import React, { useState, useEffect } from "react";
import { useApi } from "../../../hooks/useAPI";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@mui/material";
import Messagebox from "../../../component/common/messagebox/Messagebox";
import "./list.scss";


const react_app_base_url = `${process.env.REACT_APP_BASE_URL_PROTOCOL}://${window.location.hostname}:${process.env.REACT_APP_BASE_URL_PORT}`;

interface CameraGroupType {
  _id: string;
  group_name: string;
}

const AddManager: React.FC<any> = ({ back, refresh }) => {
  const { callApi } = useApi();
  const { t } = useTranslation();

  const [cameraGroups, setCameraGroups] = useState<CameraGroupType[]>([]);
  const [cameraGroupId, setCameraGroupId] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [mobiles, setMobiles] = useState<string[]>([]);
  const [mobileInput, setMobileInput] = useState("");
  const [telegramToken, setToken] = useState("");
  const [chatId, setChat] = useState("");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [mobileEnabled, setMobileEnabled] = useState(true);
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "warning">("success");
  const [formloader, setFormloader] = useState(false);

  const [usedGroupIds, setUsedGroupIds] = useState<any>(new Set());

  // Load all camera groups
  useEffect(() => {
    callApi(`${react_app_base_url}/api/camgroup`, { method: "GET" })
      .then((res: any) => setCameraGroups(res.data?.groups ?? []))
      .catch(() => setCameraGroups([]));
  }, []);

  // Load already used camera groups from notifications
  useEffect(() => {
    callApi(`${react_app_base_url}/api/notification`)
      .then((res: any) => {
        const ids = new Set(
          (res.data?.data ?? [])
            .map((item: any) => {
              // Only include valid camera_group_id objects with _id
              if (!item.camera_group_id) return null;
              return typeof item.camera_group_id === "string"
                ? item.camera_group_id
                : item.camera_group_id._id?.toString() ?? null;
            })
            .filter((id: any): id is string => !!id) // ensures TypeScript knows this is string
        );
        setUsedGroupIds(ids);
      })
      .catch(() => setUsedGroupIds(new Set()));
  }, []);


  // Only show unassigned camera groups
  const availableGroups = cameraGroups.filter((group) => {
    const groupIdStr = group._id.toString(); // always string
    return !usedGroupIds.has(groupIdStr);
  });

  const save = () => {
    if (!cameraGroupId) {
      setMessage(t("Please select a camera group"));
      setMessageType("warning");
      setOpen(true);
      return;
    }

    setFormloader(true);

    const payload = {
      camera_group_id: cameraGroupId,
      alerts_enabled: alertsEnabled,
      email: { enabled: emailEnabled, email_list: emails.join(",") },
      mobile: {
        enabled: mobileEnabled,
        mobile_numbers: mobiles.join(","),
      },
      telegram: { enabled: telegramEnabled, bot_token: telegramToken, chat_id: chatId },
    };

    callApi(`${react_app_base_url}/api/notification/add`, { method: "POST", body: payload })
      .then(() => {
        setMessage(t("Saved successfully"));
        setMessageType("success");
        setOpen(true);

        // mark group as used
        setUsedGroupIds((prev: any) => new Set(prev).add(cameraGroupId));

        setTimeout(() => {
          setOpen(false);
          back();
          refresh();
        }, 700);
      })
      .catch((err: any) => {
        //  check Axios response for backend message
        const backendMsg = err?.response?.data?.message;
        const msg =
          backendMsg === "Notification config already exists"
            ? t("This group is already assigned and cannot be added")
            : t("genericError");

        setMessage(msg);
        setMessageType("error");
        setOpen(true);
      })
      .finally(() => setFormloader(false));
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidMobile = (mobile: string) => {
    return /^\+?\d{10}$/.test(mobile); // allows 10–15 digits with optional +
  };

  const addEmailChip = (value: string) => {
    const email = value.trim();
    if (!email) return;

    if (!isValidEmail(email)) {
      setMessage(t("Invalid email address"));
      setMessageType("warning");
      setOpen(true);
      return;
    }

    if (emails.includes(email)) return;

    setEmails((prev) => [...prev, email]);
    setEmailInput("");
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      addEmailChip(emailInput.replace(",", ""));
    }
  };

  const removeEmail = (email: string) => {
    setEmails((prev) => prev.filter((e) => e !== email));
  };

  const addMobileChip = (value: string) => {
    const phone = value.trim();
    if (!phone) return;

    if (!isValidMobile(phone)) {
      setMessage(t("Invalid mobile number"));
      setMessageType("warning");
      setOpen(true);
      return;
    }

    if (mobiles.includes(phone)) return;

    setMobiles((prev) => [...prev, phone]);
    setMobileInput("");
  };


  const handleMobileKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      addMobileChip(mobileInput.replace(",", ""));
    }
  };

  const removeMobile = (phone: string) => {
    setMobiles((prev) => prev.filter((m) => m !== phone));
  };



  return (

    <div style={{ marginLeft: 63 }}>
      <Messagebox
        open={open}
        handleClose={() => setOpen(false)}
        message={message}
        warning={messageType !== "success"}
      />

      <div>


        <h3
          style={{
            fontSize: "24px",          // slightly smaller
            fontWeight: "500",
            color: "#2f2f2f",          // soft charcoal
            fontFamily: `"Inter", "Segoe UI", "Roboto", system-ui, sans-serif`,
            marginBottom: "4px",
            paddingBottom: "6px",
            marginLeft: "5px",
            letterSpacing: "0.2px",
            marginTop: "8px",
          }}
        >
          {t("Add Notification Manager")}
        </h3>

        {/* Camera Group Dropdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "20px" }}>
          <label style={{ fontWeight: 500 }}>{t("Camera Group")}</label>
          <select
            value={cameraGroupId}
            onChange={(e) => setCameraGroupId(e.target.value)}
            style={{
              padding: "0.4rem 0.6rem",
              border: "1px solid #ccc",
              fontSize: "0.95rem",
              backgroundColor: "#fff",
              height: "42px",
              width: "530px",
            }}
          >
            <option value="">{t("Select a group")}</option>
            {availableGroups.map((group) => (
              <option key={group._id} value={group._id}>
                {group.group_name}
              </option>
            ))}
          </select>
        </div>

        {/* Email */}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            marginTop: "10px",
            width: "530px",
            maxWidth: "100%",
          }}
        >
          {/* LABEL */}
          <label
            style={{
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Checkbox
              checked={emailEnabled}
              onChange={(e) => setEmailEnabled(e.target.checked)}
            />
            <span>{t("Email")}</span>
          </label>

          {/* CHIP INPUT CONTAINER */}
          <div
            style={{
              padding: "0.4rem 0.6rem",
              border: "1px solid #ccc",
              fontSize: "0.95rem",
              backgroundColor: "#fff",
              minHeight: "38px",

              display: "flex",
              alignItems: "center",
              gap: "6px",

              flexWrap: "wrap",
              overflow: "hidden",
            }}
          >
            {/* CHIPS */}
            {emails.map((mail) => (
              <span
                key={mail}
                style={{
                  backgroundColor: "var(--bs-primary)",
                  color: "#fff",
                  padding: "4px 10px",
                  borderRadius: "16px",
                  fontSize: "0.8rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                  flexShrink: 0, // 🔑 chip never shrinks
                }}
              >
                {mail}
                <span
                  style={{
                    cursor: "pointer",
                    fontWeight: "bold",
                    lineHeight: 1,
                  }}
                  onClick={() => removeEmail(mail)}
                >
                  ×
                </span>
              </span>
            ))}

            {/* INPUT */}
            <input
              disabled={!emailEnabled}
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={handleEmailKeyDown}
              placeholder={
                emails.length === 0 ? t("Email addresses, comma separated") : ""
              }
              style={{
                border: "none",
                outline: "none",
                fontSize: "0.95rem",
                backgroundColor: "transparent",
                flex: 1,
                minWidth: "140px",
                height: "30px",
              }}
            />
          </div>
        </div>



        {/* Mobile */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            marginTop: "10px",
            width: "530px",
            maxWidth: "100%",
          }}
        >          {/* LABEL */}
          <label
            style={{
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Checkbox
              checked={mobileEnabled}
              onChange={(e) => setMobileEnabled(e.target.checked)}
            />
            <span>{t("Mobile")}</span>
          </label>

          {/* CHIP INPUT CONTAINER */}
          <div
            style={{
              padding: "0.4rem 0.6rem",
              border: "1px solid #ccc",
              fontSize: "0.95rem",
              backgroundColor: "#fff",
              minHeight: "38px",

              display: "flex",
              alignItems: "center",
              gap: "6px",

              flexWrap: "wrap",
              overflow: "hidden",
            }}
          >
            {/* CHIPS */}
            {mobiles.map((phone) => (
              <span
                key={phone}
                className="bg-primary text-white px-3 py-1 rounded-pill d-inline-flex align-items-center gap-2"
                style={{ fontSize: "0.8rem", flexShrink: 0 }}
              >
                {phone}
                <span
                  style={{ cursor: "pointer", fontWeight: "bold", lineHeight: 1 }}
                  onClick={() => removeMobile(phone)}
                >
                  ×
                </span>
              </span>
            ))}

            {/* INPUT */}
            <input
              disabled={!mobileEnabled}
              value={mobileInput}
              onChange={(e) => setMobileInput(e.target.value)}
              onKeyDown={handleMobileKeyDown}
              placeholder={
                mobiles.length === 0
                  ? t("Mobile numbers, comma separated")
                  : ""
              }
              style={{
                border: "none",
                outline: "none",
                fontSize: "0.95rem",
                backgroundColor: "transparent",
                flex: 1,
                minWidth: "140px",
                height: "30px",

              }}
            />
          </div>
        </div>


        {/* Telegram */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "10px" }}>
          <label style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Checkbox
              checked={telegramEnabled}
              onChange={(e) => setTelegramEnabled(e.target.checked)}
            />
            {t("Telegram")}
          </label>
          <input
            disabled={!telegramEnabled}
            placeholder={t("Telegram bot token")}
            value={telegramToken}
            onChange={(e) => setToken(e.target.value)}
            style={{
              padding: "0.4rem 0.6rem",
              border: "1px solid #ccc",
              fontSize: "0.95rem",
              backgroundColor: "#fff",
              height: "44px",
              width: "530px",

            }}
          />
          <input
            disabled={!telegramEnabled}
            placeholder={t("Telegram chat ID")}
            value={chatId}
            onChange={(e) => setChat(e.target.value)}
            style={{
              padding: "0.4rem 0.6rem",
              border: "1px solid #ccc",
              fontSize: "0.95rem",
              backgroundColor: "#fff",
              height: "42px",
              width: "530px",
            }}
          />
        </div>

        {/* Alerts */}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "10px",
        }}>
          <Checkbox
            checked={alertsEnabled}
            onChange={(e) => setAlertsEnabled(e.target.checked)}
          />
          <label style={{ fontWeight: 500 }}>{t("Enable Alerts")}</label>
        </div>

        {/* Buttons */}
        <div className="form-button-group" style={{ marginLeft: 15, marginBottom: "20px" }}>
          <button className="outlined-button" onClick={back}>
            {t("Cancel")}
          </button>
          <button
            className="filled-button"
            onClick={save}
            disabled={formloader || !cameraGroupId}
          >
            {formloader ? t("Saving...") : t("Save Group")}
          </button>


        </div>
      </div>
    </div>
  );
};

export default AddManager;