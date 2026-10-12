# Linux administration resources

## Knowledge

- [Red Hat: RHCSA exam (EX200)](https://www.redhat.com/en/services/training/ex200-red-hat-certified-system-administrator-rhcsa-exam)
  Official study points for the performance-based administrator exam on RHEL 10. Use for: what this course must cover, and in which grouping. RHCSA is required before either Red Hat engineer credential.
- [Red Hat: Red Hat Certified Engineer in Enterprise Linux](https://www.redhat.com/en/services/certification/red-hat-certified-engineer-in-enterprise-linux)
  States that RHCE in Enterprise Linux requires RHCSA plus EX342. Use for: the engineer step after the administrator exam.
- [Red Hat: EX342 diagnostics and troubleshooting](https://www.redhat.com/en/services/training/ex342-red-hat-certified-specialist-linux-diagnostics-and-troubleshooting)
  Official objectives for application, boot, storage, network, and authentication failures. Use for: the later half of the course, once EX200 tasks are in place.
- [systemctl(1)](https://man7.org/linux/man-pages/man1/systemctl.1.html)
  Manual for service status, start, and stop. Use for: what `systemctl status` actually prints, including the Active line and the short journal excerpt.
- [journalctl(1)](https://man7.org/linux/man-pages/man1/journalctl.1.html)
  Manual for the systemd journal. Use for: `-u` / `--unit`, `-n` / `--lines`, `--no-pager`, and who may read the system journal.
- [Red Hat: Managing system services with systemctl (RHEL 10)](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/10/html/using_systemd_unit_files_to_customize_and_optimize_your_system/managing-system-services-with-systemctl)
  Vendor procedure for listing, status, start, stop, restart, and boot enablement. Use for: the service half of "operate running systems."
- [Red Hat: Troubleshooting with log files (RHEL 9)](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/configuring_basic_system_settings/assembly_troubleshooting-problems-using-log-files_configuring-basic-system-settings)
  Vendor procedure for `journalctl`, including one service. Use for: the log half of an application-support check. RHEL 10's log chapter is in [Risk reduction and recovery operations](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/10/html/risk_reduction_and_recovery_operations/troubleshooting-problems-by-using-log-files).

## Wisdom (Communities)

- [Server Fault](https://serverfault.com/)
  Moderated Q&A for professional administrators. Use for: a real incident that the lesson did not cover.
- [Unix & Linux Stack Exchange](https://unix.stackexchange.com/)
  High-signal Q&A, stricter than a forum. Use for: why a command behaved differently from the manual.
- [r/linuxadmin](https://www.reddit.com/r/linuxadmin/)
  Working administrators. Use for: how app-support access is usually granted on a team.

## Gaps

- The distribution and application names on the new job are not known yet.
- No lab machine is recorded here yet. EX200 is sat on a live RHEL system, so a lab will matter before the later tasks.
