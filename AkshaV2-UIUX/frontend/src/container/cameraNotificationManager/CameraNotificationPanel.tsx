import React from "react";
import { Checkbox } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import axios from "axios";
import { useTranslation } from "react-i18next";

const react_app_base_url = `${process.env.REACT_APP_BASE_URL_PROTOCOL}://${window.location.hostname}:${process.env.REACT_APP_BASE_URL_PORT}`;

/* ================= TYPES ================= */

interface NotificationItem {
  _id: string;
  camera_group_id: {
    _id: string;
    group_name: string;
  } | null;
  email?: {
    enabled: boolean;
    email_list?: string;
  } | null;
  mobile?: {
    enabled: boolean;
    mobile_numbers?: string;
  } | null;
  telegram?: {
    enabled: boolean;
    bot_token?: string;
    chat_id?: string;
  } | null;
  alerts_enabled?: boolean;
}

interface Props {
  is_mobile: boolean
  list: NotificationItem[];
  showAddGroup: () => void;
  showeditpage: (item: NotificationItem) => void;
  showdeletemodal: (item: NotificationItem) => void;
  refreshList: () => void;
}

/* ================= COMPONENT ================= */

const CameraNotificationPanel: React.FC<Props> = ({
  list,
  showAddGroup,
  showeditpage,
  showdeletemodal,
  refreshList,
}) => {
  const { t } = useTranslation();

  /* ================= DERIVED STATE ================= */


  const allEnabled =
    list.length > 0 &&
    list.every((item) => item.alerts_enabled && item.camera_group_id);

  const someEnabled =
    list.some((item) => item.alerts_enabled && item.camera_group_id);

  /* ================= API ACTIONS ================= */

  const toggleSingleChannel = async (
    groupId: string,
    channel: "email" | "mobile" | "telegram",
    enabled: boolean
  ) => {
    try {
      await axios.put(
        `${react_app_base_url}/api/notification/toggle/group/${groupId}/${channel}`,
        { enabled }
      );
      refreshList();
    } catch (err) {
      console.error(err);
      alert(t("Failed to update channel"));
    }
  };

  const toggleGroup = async (groupId: string, enabled: boolean) => {
    try {
      await axios.put(
        `${react_app_base_url}/api/notification/toggle/group/${groupId}`,
        { enabled }
      );
      refreshList();
    } catch (err) {
      console.error(err);
      alert(t("Failed to update group"));
    }
  };

  const toggleAllGroups = async (enabled: boolean) => {
    try {
      await axios.put(
        `${react_app_base_url}/api/notification/toggle/all`,
        { enabled }
      );
      refreshList();
    } catch (err) {
      console.error(err);
      alert(t("Failed to update all groups"));
    }
  };

  /* ================= Fields ================= */

  const maskValue = (value?: string, visibleChars = 3) => {
    if (!value) return "-";

    const len = value.length;
    if (len <= visibleChars) return value;

    return "*".repeat(len - visibleChars) + value.slice(-visibleChars);
  };

  /* =================Field to be More Readable ================= */

  const renderCommaList = (value?: string) => {
    if (!value) return null;

    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
      .map((item, idx) => (
        <div key={idx} className="small text-muted">
          • {item}
        </div>
      ));
  };

  /* ================= UI ================= */

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-2">
          <Checkbox
            checked={allEnabled}
            indeterminate={!allEnabled && someEnabled}
            onChange={(e) => toggleAllGroups(e.target.checked)}
            sx={{
              '& .MuiSvgIcon-root': {
                fontSize: 28,          // make checkbox bigger
              },
              '&.Mui-checked': {
                color: '#66bb6a',        // green only when checked
              },
            }}
          />
          <span
            className="fw-semibold"
            style={{ fontSize: '16px', color: '#333' }} // label bigger
          >
            {t("Enable Alerts for All Groups")}
          </span>
        </div>

        <button className="btn btn-primary px-4" onClick={showAddGroup}>
          {t("Add Notification Group")}
        </button>
      </div>

      {/* Table */}
      <table className="table table-bordered align-middle">
        <thead className="table-dark">
          <tr>
            <th>{t("Group Name")}</th>
            <th>{t("Email")}</th>
            <th>{t("Mobile Chat")}</th>
            <th>{t("Telegram Chat")}</th>
            <th>{t("Group Master")}</th>
            <th>{t("Actions")}</th>
          </tr>
        </thead>

        <tbody>
          {list.map((item) => {
            if (!item.camera_group_id) {
              return null; // or render a fallback row
            }
            const groupId = item.camera_group_id._id;
            const groupEnabled = !!item.alerts_enabled;

            return (
              <tr
                key={item._id}
                className={!groupEnabled ? "table-secondary opacity-75" : ""}
              >
                {/* Group Name */}
                <td>
                  {item.camera_group_id.group_name}
                  {!groupEnabled && (
                    <span className="badge bg-warning ms-2">
                      {t("Paused")}
                    </span>
                  )}
                </td>

                {/* Email */}
                <td>
                  <Checkbox
                    checked={!!item.email?.enabled}
                    disabled={!groupEnabled}
                    onChange={(e) =>
                      toggleSingleChannel(
                        groupId,
                        "email",
                        e.target.checked
                      )
                    }
                  />
                  {item.email?.enabled && (
                    <div className="mt-1">
                      {renderCommaList(item.email.email_list)}
                    </div>
                  )}

                </td>

                {/* Mobile */}
                <td>
                  <Checkbox
                    checked={!!item.mobile?.enabled}
                    disabled={!groupEnabled}
                    onChange={(e) =>
                      toggleSingleChannel(
                        groupId,
                        "mobile",
                        e.target.checked
                      )
                    }
                  />
                  {item.mobile?.enabled && (
                    <div className="mt-1">
                      {renderCommaList(item.mobile.mobile_numbers)}
                    </div>
                  )}

                </td>

                {/* Telegram */}
                <td>
                  {item.telegram?.enabled ? (
                    <div className="d-flex flex-column">
                      <small className="text-muted">
                        Token: {maskValue(item.telegram?.bot_token)}
                      </small>
                      <small className="text-muted">
                        Chat ID: {maskValue(item.telegram?.chat_id)}
                      </small>
                    </div>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>


                {/* Group Master */}
                <td>
                  <Checkbox
                    checked={groupEnabled}
                    onChange={(e) =>
                      toggleGroup(groupId, e.target.checked)
                    }
                  />
                </td>

                {/* Actions */}
                <td>
                  <Tooltip title={t("Edit")}>
                    <button
                      className="btn btn-link p-1"
                      onClick={() => showeditpage(item)}
                    >
                      <i className="bx bx-edit-alt text-primary fs-5"></i>
                    </button>
                  </Tooltip>

                  <Tooltip title={t("Delete Group")}>
                    <button
                      className="btn btn-link p-1"
                      onClick={() => showdeletemodal(item)}
                    >
                      <i className="bx bx-trash text-danger fs-5"></i>
                    </button>
                  </Tooltip>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default React.memo(CameraNotificationPanel);
