use tauri_plugin_updater::Error as UpdaterError;

use crate::domains::app_updates::domain::AppUpdateError;

pub fn map_updater_error(error: UpdaterError) -> AppUpdateError {
    match error {
        UpdaterError::EmptyEndpoints => AppUpdateError::NotConfigured,
        UpdaterError::Reqwest(_)
        | UpdaterError::Network(_)
        | UpdaterError::ReleaseNotFound
        | UpdaterError::Io(_) => AppUpdateError::Network(error.to_string()),
        UpdaterError::Minisign(_) | UpdaterError::Base64(_) | UpdaterError::SignatureUtf8(_) => {
            AppUpdateError::InvalidSignature
        }
        UpdaterError::UnsupportedArch
        | UpdaterError::UnsupportedOs
        | UpdaterError::TargetNotFound(_)
        | UpdaterError::TargetsNotFound(_)
        | UpdaterError::FailedToDetermineExtractPath
        | UpdaterError::TempDirNotOnSameMountPoint
        | UpdaterError::BinaryNotFoundInArchive
        | UpdaterError::DebInstallFailed
        | UpdaterError::PackageInstallFailed => AppUpdateError::NotSupported,
        other => AppUpdateError::Unexpected(other.to_string()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_missing_release_is_a_network_problem() {
        assert!(matches!(
            map_updater_error(UpdaterError::ReleaseNotFound),
            AppUpdateError::Network(_)
        ));
    }

    #[test]
    fn missing_endpoints_mean_updates_are_not_configured() {
        assert_eq!(
            map_updater_error(UpdaterError::EmptyEndpoints),
            AppUpdateError::NotConfigured
        );
    }

    #[test]
    fn unsupported_platforms_and_installs_cannot_update_themselves() {
        assert_eq!(
            map_updater_error(UpdaterError::UnsupportedOs),
            AppUpdateError::NotSupported
        );
        assert_eq!(
            map_updater_error(UpdaterError::TargetNotFound("linux-x86_64".into())),
            AppUpdateError::NotSupported
        );
    }

    #[test]
    fn signature_problems_are_reported_as_an_invalid_signature() {
        assert_eq!(
            map_updater_error(UpdaterError::SignatureUtf8("bad".into())),
            AppUpdateError::InvalidSignature
        );
    }

    #[test]
    fn anything_else_keeps_its_message() {
        assert!(matches!(
            map_updater_error(UpdaterError::AuthenticationFailed),
            AppUpdateError::Unexpected(_)
        ));
    }
}
