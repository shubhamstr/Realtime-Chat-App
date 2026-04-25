-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: May 17, 2025 at 10:05 AM
-- Server version: 10.4.24-MariaDB
-- PHP Version: 8.1.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

--
-- Database: `socket_chat`
--

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `room_id` text NOT NULL,
  `message` text DEFAULT NULL,
  `attachment` text DEFAULT NULL,
  `read_flag` tinyint(4) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `user_id`, `room_id`, `message`, `attachment`, `read_flag`, `is_deleted`, `created_on`, `updated_on`) VALUES
(34, 59, 'yzqfLr-G8KSZnjRp9siHCn3asWXtgqexrKmdXABdp6Q', 'hello, is anyone there?', NULL, 0, 0, '2025-05-17 08:04:03', '2025-05-17 08:04:03'),
(35, 58, 'yzqfLr-G8KSZnjRp9siHCn3asWXtgqexrKmdXABdp6Q', 'hi, myself user1', NULL, 0, 0, '2025-05-17 08:04:12', '2025-05-17 08:04:12'),
(36, 58, 'yzqfLr-G8KSZnjRp9siHCn3asWXtgqexrKmdXABdp6Q', 'who are you?', NULL, 0, 0, '2025-05-17 08:04:20', '2025-05-17 08:04:20'),
(37, 59, 'yzqfLr-G8KSZnjRp9siHCn3asWXtgqexrKmdXABdp6Q', 'i am user2', NULL, 0, 0, '2025-05-17 08:04:25', '2025-05-17 08:04:25'),
(38, 59, 'yzqfLr-G8KSZnjRp9siHCn3asWXtgqexrKmdXABdp6Q', 'just trying this software', NULL, 0, 0, '2025-05-17 08:04:35', '2025-05-17 08:04:35'),
(39, 58, 'yzqfLr-G8KSZnjRp9siHCn3asWXtgqexrKmdXABdp6Q', 'ok', NULL, 0, 0, '2025-05-17 08:04:47', '2025-05-17 08:04:47'),
(40, 58, 'yzqfLr-G8KSZnjRp9siHCn3asWXtgqexrKmdXABdp6Q', 'is it easy to user?', NULL, 0, 0, '2025-05-17 08:04:58', '2025-05-17 08:04:58'),
(41, 58, 'yzqfLr-G8KSZnjRp9siHCn3asWXtgqexrKmdXABdp6Q', 'use*', NULL, 0, 0, '2025-05-17 08:05:02', '2025-05-17 08:05:02'),
(42, 59, 'yzqfLr-G8KSZnjRp9siHCn3asWXtgqexrKmdXABdp6Q', 'yes', NULL, 0, 0, '2025-05-17 08:05:09', '2025-05-17 08:05:09');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(100) DEFAULT NULL,
  `image` varchar(100) DEFAULT NULL,
  `chatURL` text NOT NULL,
  `isAdmin` int(11) NOT NULL DEFAULT 0,
  `email_notification_flag` tinyint(4) NOT NULL DEFAULT 0,
  `push_notification_flag` tinyint(4) NOT NULL DEFAULT 1,
  `email_message_flag` tinyint(4) NOT NULL DEFAULT 0,
  `push_message_flag` tinyint(4) NOT NULL DEFAULT 1,
  `is_active` tinyint(4) NOT NULL DEFAULT 1,
  `created_on` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_on` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `image`, `chatURL`, `isAdmin`, `email_notification_flag`, `push_notification_flag`, `email_message_flag`, `push_message_flag`, `is_active`, `created_on`, `updated_on`) VALUES
(58, 'user1', NULL, NULL, 'yzqfLr-G8KSZnjRp9siHCn3asWXtgqexrKmdXABdp6Q', 0, 0, 1, 0, 1, 1, '2025-05-17 08:03:38', '2025-05-17 08:03:38'),
(59, 'user2', NULL, NULL, 'yzqfLr-G8KSZnjRp9siHCn3asWXtgqexrKmdXABdp6Q', 0, 0, 1, 0, 1, 1, '2025-05-17 08:03:51', '2025-05-17 08:03:51');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=60;
COMMIT;
